import { useState, type ComponentProps } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router';
import { ArrowLeft, Mail, Lock, Key } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/useAuthStore';

// Schemas for form validations
const step1Schema = z.object({
  email: z.string().email('Địa chỉ email không hợp lệ'),
});

const step2Schema = z.object({
  code: z.string().length(6, 'Mã xác thực phải gồm 6 chữ số'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
  confirmPassword: z.string().min(6, 'Mật khẩu xác nhận phải có ít nhất 6 ký tự'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

type Step1FormValues = z.infer<typeof step1Schema>;
type Step2FormValues = z.infer<typeof step2Schema>;

export function ForgotPasswordForm({
  className,
  ...props
}: ComponentProps<"div">) {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const { forgotPassword, resetPassword, loading } = useAuthStore();
  const navigate = useNavigate();

  // Step 1 Form
  const {
    register: registerStep1,
    handleSubmit: handleSubmitStep1,
    formState: { errors: errorsStep1, isSubmitting: isSubmittingStep1 },
  } = useForm<Step1FormValues>({
    resolver: zodResolver(step1Schema),
  });

  // Step 2 Form
  const {
    register: registerStep2,
    handleSubmit: handleSubmitStep2,
    formState: { errors: errorsStep2, isSubmitting: isSubmittingStep2 },
  } = useForm<Step2FormValues>({
    resolver: zodResolver(step2Schema),
  });

  const onStep1Submit = async (data: Step1FormValues) => {
    try {
      await forgotPassword(data.email);
      setEmail(data.email);
      setStep(2);
    } catch (error) {
      // handled by store toasts
    }
  };

  const onStep2Submit = async (data: Step2FormValues) => {
    try {
      await resetPassword(email, data.code, data.newPassword);
      navigate('/signin');
    } catch (error) {
      // handled by store toasts
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="p-0 overflow-hidden border-border">
        <CardContent className="grid p-0 md:grid-cols-2">
          {/* Form container */}
          <div className="p-6 md:p-8 flex flex-col justify-center">
            
            {/* Back button */}
            <button
              onClick={() => step === 2 ? setStep(1) : navigate('/signin')}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary mb-6 transition-colors self-start cursor-pointer border-none bg-transparent"
            >
              <ArrowLeft className="h-4 w-4" />
              {step === 2 ? 'Quay lại bước nhập email' : 'Quay lại đăng nhập'}
            </button>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <a href="/" className="block mx-auto text-center w-fit">
                  <img src="/logo.svg" alt="logo" className="h-10" />
                </a>
                <h1 className="text-2xl font-bold capitalize">Quên mật khẩu</h1>
                <p className="text-muted-foreground text-balance text-sm">
                  {step === 1 
                    ? 'Nhập email liên kết với tài khoản của bạn để nhận mã xác thực OTP' 
                    : `Mã xác thực OTP gồm 6 chữ số đã được gửi tới ${email}`}
                </p>
              </div>

              {step === 1 ? (
                /* STEP 1: ENTER EMAIL */
                <form onSubmit={handleSubmitStep1(onStep1Submit)} className="space-y-4">
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="email" className="block text-sm">Địa chỉ Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="midi@gmail.com"
                        className="pl-10"
                        {...registerStep1('email')}
                      />
                    </div>
                    {errorsStep1.email && (
                      <p className="text-sm text-destructive">{errorsStep1.email.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full cursor-pointer mt-2"
                    disabled={isSubmittingStep1 || loading}
                  >
                    {loading || isSubmittingStep1 ? 'Đang gửi mã...' : 'Gửi mã xác nhận'}
                  </Button>
                </form>
              ) : (
                /* STEP 2: VERIFY AND RESET */
                <form onSubmit={handleSubmitStep2(onStep2Submit)} className="space-y-4">
                  {/* Dummy field to capture browser auto-fill */}
                  <input
                    type="text"
                    name="email"
                    autoComplete="username"
                    value={email}
                    readOnly
                    className="hidden"
                  />
                  {/* OTP Code */}
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="code" className="block text-sm">Mã OTP (6 chữ số)</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="code"
                        type="text"
                        placeholder="123456"
                        className="pl-10 text-center tracking-widest font-mono font-bold"
                        maxLength={6}
                        autoComplete="one-time-code"
                        {...registerStep2('code')}
                      />
                    </div>
                    {errorsStep2.code && (
                      <p className="text-sm text-destructive">{errorsStep2.code.message}</p>
                    )}
                  </div>

                  {/* New Password */}
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="newPassword" className="block text-sm">Mật khẩu mới</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type="password"
                        className="pl-10"
                        placeholder="******"
                        autoComplete="new-password"
                        {...registerStep2('newPassword')}
                      />
                    </div>
                    {errorsStep2.newPassword && (
                      <p className="text-sm text-destructive">{errorsStep2.newPassword.message}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="confirmPassword" className="block text-sm">Xác nhận mật khẩu mới</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        className="pl-10"
                        placeholder="******"
                        autoComplete="new-password"
                        {...registerStep2('confirmPassword')}
                      />
                    </div>
                    {errorsStep2.confirmPassword && (
                      <p className="text-sm text-destructive">{errorsStep2.confirmPassword.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full cursor-pointer mt-4"
                    disabled={isSubmittingStep2 || loading}
                  >
                    {loading || isSubmittingStep2 ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
                  </Button>
                </form>
              )}
            </div>
          </div>

          {/* Cover Image (Match other pages) */}
          <div className="relative hidden bg-muted md:block">
            <img
              src="/reset-password.png"
              alt="Image"
              className="absolute object-cover -translate-y-1/2 top-1/2"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-xs text-balance px-6 text-center *:[a]:hover:text-primary text-muted-foreground *:[a]:underline *:[a]:underline-offset-4">
        Bằng cách tiếp tục, bạn đồng ý với <a href="#">Điều khoản dịch vụ</a> và <a href="#">Chính sách bảo mật</a>.
      </div>
    </div>
  );
}
