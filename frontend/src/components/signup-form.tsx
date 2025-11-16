import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { Input } from "@/components/ui/input"
import { Label } from "./ui/label"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="p-0 overflow-hidden border-border">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <a href="/" className="block mx-auto text-center w-fit">
                  <img src="/logo.svg" alt="logo" />
                </a>
                <h1 className="text-2xl font-bold capitalize">tạo tài khoản Midi</h1>
                <p className="text-muted-foreground text-balance">Chào mừng bạn! Hãy đăng ký để bắt đầu</p>
              </div>
              <div className="grid grid-cols-2 gap-3 ">
                <div className="space-y-2">
                  <Label htmlFor="lastname" className="block text-sm">Họ</Label>
                  <Input id="lastname"
                    type="text" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstname" className="block text-sm">Tên</Label>
                  <Input id="firstname"
                    type="text" />
                </div>
                </div>

                {/* username */}

                 <div className="flex flex-col gap-3">
                    <Label htmlFor="username" className="block text-sm">Tên đăng nhập</Label>
                    <Input id="username"
                      type="text" 
                      placeholder="midi"/>
                  </div>

                {/* email */}
                <div className="flex flex-col gap-3">
                  <Label htmlFor="email" className="block text-sm">Email</Label>
                  <Input id="email"
                    type="email" 
                    placeholder="midi@gmail.com"/>                    
                </div>

                {/* password */}
                <div className="flex flex-col gap-3">
                  <Label htmlFor="password" className="block text-sm">Mật khẩu</Label>
                  <Input id="password"
                    type="password" 
                    />
                </div>
                <Button
                  type="submit"
                  className="w-full">
                  Tạo tài khoản
                </Button>
                <div className="text-sm text-center">
                  Đã có tài khoản?{" "}
                  <a href="/signin" className="underline hover:text-primary underline-offset-4">
                    Đăng nhập
                  </a>
                </div>
            </div>
          </form>
          <div className="relative hidden bg-muted md:block">
            <img
              src="/placeholderSignUp.png"
              alt="Image"
              className="absolute object-cover -translate-y-1/2 top-1/2 "
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-xs text-balance px-6 text-center *:[a]:hover:text-primary text-muted-foreground *:[a]:underline *:[a]:underline-offset-4 ">
        Bằng cách tiếp tục, bạn đồng ý với <a href="#">Điều khoản dịch vụ</a>{" "}
        và <a href="#">Chính sách bảo mật</a>.
      </div>
    </div>
  )
}
