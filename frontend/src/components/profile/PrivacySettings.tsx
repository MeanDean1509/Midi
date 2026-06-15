import { Shield, Bell, ShieldBan, Lock, ArrowLeft } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserStore } from "@/stores/useUserStore";
import { useState } from "react";
import { toast } from "sonner";

const PrivacySettings = () => {
  const { changePassword, deleteAccount } = useUserStore();
  const [view, setView] = useState<"menu" | "changePassword" | "deleteAccount">("menu");
  const [loading, setLoading] = useState(false);

  // Change password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Delete account states
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState("");

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Vui lòng điền đầy đủ các thông tin");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu mới và xác nhận mật khẩu không khớp");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setView("menu");
    } catch (error) {
      // error is handled in store
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteConfirmPassword) {
      toast.error("Vui lòng nhập mật khẩu xác nhận");
      return;
    }

    const isConfirmed = window.confirm(
      "CẢNH BÁO: Bạn có chắc chắn muốn xóa tài khoản này không? Hành động này sẽ xóa vĩnh viễn dữ liệu của bạn và không thể hoàn tác."
    );
    if (!isConfirmed) return;

    setLoading(true);
    try {
      await deleteAccount(deleteConfirmPassword);
    } catch (error) {
      // error is handled in store
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-strong border-border/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {view !== "menu" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 mr-1"
              onClick={() => setView("menu")}
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Shield className="h-5 w-5 text-primary" />
          {view === "menu" && "Quyền riêng tư & Bảo mật"}
          {view === "changePassword" && "Đổi mật khẩu"}
          {view === "deleteAccount" && "Xóa tài khoản"}
        </CardTitle>
        <CardDescription>
          {view === "menu" && "Quản lý cài đặt quyền riêng tư và bảo mật của bạn"}
          {view === "changePassword" && "Cập nhật mật khẩu để bảo vệ tài khoản của bạn"}
          {view === "deleteAccount" && "Hành động này sẽ xóa vĩnh viễn tài khoản của bạn"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {view === "menu" && (
          <>
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start glass-light border-border/30 hover:text-warning"
                onClick={() => setView("changePassword")}
              >
                <Lock className="h-4 w-4 mr-2" />
                Đổi mật khẩu
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start glass-light border-border/30 hover:text-info"
                disabled
              >
                <Bell className="h-4 w-4 mr-2" />
                Cài đặt thông báo (Sắp ra mắt)
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start glass-light border-border/30 hover:text-destructive"
                disabled
              >
                <ShieldBan className="size-4 mr-2" />
                Chặn & Báo cáo (Sắp ra mắt)
              </Button>
            </div>

            <div className="pt-4 border-t border-border/30">
              <h4 className="font-medium mb-3 text-destructive">Khu vực nguy hiểm</h4>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setView("deleteAccount")}
              >
                Xoá tài khoản
              </Button>
            </div>
          </>
        )}

        {view === "changePassword" && (
          <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
              <Input
                id="current-password"
                type="password"
                placeholder="Nhập mật khẩu hiện tại"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">Mật khẩu mới</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setView("menu")}
                disabled={loading}
              >
                Hủy
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Đang xử lý..." : "Lưu mật khẩu"}
              </Button>
            </div>
          </form>
        )}

        {view === "deleteAccount" && (
          <form onSubmit={handleDeleteAccountSubmit} className="space-y-4">
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
              Cảnh báo: Hành động này là không thể khôi phục. Mọi tin nhắn, bạn bè, nhóm trò chuyện và dữ liệu của bạn sẽ bị xóa vĩnh viễn.
            </div>

            <div className="space-y-2">
              <Label htmlFor="delete-confirm-password">
                Nhập mật khẩu của bạn để xác nhận
              </Label>
              <Input
                id="delete-confirm-password"
                type="password"
                placeholder="Nhập mật khẩu của bạn"
                value={deleteConfirmPassword}
                onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setView("menu")}
                disabled={loading}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="destructive"
                className="flex-1"
                disabled={loading}
              >
                {loading ? "Đang xóa..." : "Xóa tài khoản vĩnh viễn"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default PrivacySettings;