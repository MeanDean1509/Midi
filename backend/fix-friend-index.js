import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const fixFriendIndex = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_CONECTIONSTRING);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('friends');

        // Get all existing indexes
        const indexes = await collection.indexes();
        console.log('Current indexes:', JSON.stringify(indexes, null, 2));

        // Drop all old incorrect indexes if they exist
        const indexesToDrop = ['UserA_1_UserB_1', 'userA_1_UserB_1'];
        
        for (const indexName of indexesToDrop) {
            try {
                await collection.dropIndex(indexName);
                console.log(`✓ Dropped old index: ${indexName}`);
            } catch (error) {
                if (error.code === 27) {
                    console.log(`Old index ${indexName} not found (already removed)`);
                } else {
                    throw error;
                }
            }
        }

        // Ensure the correct lowercase index exists
        await collection.createIndex({ userA: 1, userB: 1 }, { unique: true });
        console.log('✓ Created new index: userA_1_userB_1');

        // Verify indexes
        const newIndexes = await collection.indexes();
        console.log('\nFinal indexes:', JSON.stringify(newIndexes, null, 2));

        console.log('\n✓ Index migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing index:', error);
        process.exit(1);
    }
};

fixFriendIndex();
