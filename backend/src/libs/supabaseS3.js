import crypto from 'crypto';

const requiredEnv = [
    'PUBLIC_SUPABASE_URL',
    'SUPABASE_S3_STORAGE_URL',
    'SUPABASE_S3_ACCESS_KEY',
    'SUPABASE_S3_SECRET_KEY',
    'SUPABASE_S3_BUCKET_NAME',
    'SUPABASE_S3_REGION',
];

const getEnv = (name) => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
};

const hash = (value, encoding = 'hex') =>
    crypto.createHash('sha256').update(value).digest(encoding);

const hmac = (key, value, encoding) =>
    crypto.createHmac('sha256', key).update(value).digest(encoding);

const encodeKey = (key) => key.split('/').map(encodeURIComponent).join('/');

const getSigningKey = (secretKey, dateStamp, region) => {
    const kDate = hmac(`AWS4${secretKey}`, dateStamp);
    const kRegion = hmac(kDate, region);
    const kService = hmac(kRegion, 's3');
    return hmac(kService, 'aws4_request');
};

const getSignedUrlExpires = () => {
    const value = Number(process.env.SUPABASE_S3_SIGNED_URL_EXPIRES || 86400);
    return Number.isFinite(value) && value > 0 ? Math.min(value, 604800) : 86400;
};

const buildPresignedGetUrl = ({ endpoint, accessKey, secretKey, bucketName, objectKey, region, fileName }) => {
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
    const url = new URL(`${endpoint}/${bucketName}/${encodeKey(objectKey)}`);
    const disposition = `attachment; filename="${fileName}"`;
    const params = [
        ['X-Amz-Algorithm', 'AWS4-HMAC-SHA256'],
        ['X-Amz-Credential', `${accessKey}/${credentialScope}`],
        ['X-Amz-Date', amzDate],
        ['X-Amz-Expires', String(getSignedUrlExpires())],
        ['X-Amz-SignedHeaders', 'host'],
        ['response-content-disposition', disposition],
    ];

    const canonicalQueryString = params
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .sort()
        .join('&');
    const canonicalRequest = [
        'GET',
        url.pathname,
        canonicalQueryString,
        `host:${url.host}\n`,
        'host',
        'UNSIGNED-PAYLOAD',
    ].join('\n');
    const stringToSign = [
        'AWS4-HMAC-SHA256',
        amzDate,
        credentialScope,
        hash(canonicalRequest),
    ].join('\n');
    const signature = hmac(getSigningKey(secretKey, dateStamp, region), stringToSign, 'hex');

    return `${url.origin}${url.pathname}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
};

export const uploadFileToSupabaseS3 = async ({ buffer, originalName, mimetype }) => {
    requiredEnv.forEach(getEnv);

    const endpoint = getEnv('SUPABASE_S3_STORAGE_URL').replace(/\/$/, '');
    const accessKey = getEnv('SUPABASE_S3_ACCESS_KEY');
    const secretKey = getEnv('SUPABASE_S3_SECRET_KEY');
    const bucketName = getEnv('SUPABASE_S3_BUCKET_NAME');
    const region = getEnv('SUPABASE_S3_REGION');

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const safeName = originalName
        .normalize('NFKD')
        .replace(/[^\w.\-]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'file';
    const objectKey = `messages/${dateStamp}/${crypto.randomUUID()}-${safeName}`;
    const objectPath = `/${bucketName}/${encodeKey(objectKey)}`;
    const url = new URL(`${endpoint}${objectPath}`);

    const payloadHash = hash(buffer);
    const headers = {
        host: url.host,
        'content-type': mimetype || 'application/octet-stream',
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': amzDate,
    };

    const signedHeaders = Object.keys(headers).sort().join(';');
    const canonicalHeaders = Object.keys(headers)
        .sort()
        .map((name) => `${name}:${headers[name]}\n`)
        .join('');
    const canonicalRequest = [
        'PUT',
        url.pathname,
        '',
        canonicalHeaders,
        signedHeaders,
        payloadHash,
    ].join('\n');
    const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
    const stringToSign = [
        'AWS4-HMAC-SHA256',
        amzDate,
        credentialScope,
        hash(canonicalRequest),
    ].join('\n');
    const signature = hmac(getSigningKey(secretKey, dateStamp, region), stringToSign, 'hex');

    const res = await fetch(url, {
        method: 'PUT',
        headers: {
            ...headers,
            authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
        },
        body: buffer,
    });

    if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(`Supabase S3 upload failed (${res.status}): ${errorText}`);
    }

    return {
        url: buildPresignedGetUrl({
            endpoint,
            accessKey,
            secretKey,
            bucketName,
            objectKey,
            region,
            fileName: safeName,
        }),
        key: objectKey,
    };
};
