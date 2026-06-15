import { Heart } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { User } from "@/types/user";
import { useUserStore } from "@/stores/useUserStore";
import { toast } from "sonner";

type EditableField = {
  key: keyof Pick<User, "displayName" | "username" | "email" | "phone">;
  label: string;
  type?: string;
};

const PERSONAL_FIELDS: EditableField[] = [
  { key: "displayName", label: "Tên hiển thị" },
  { key: "username", label: "Tên người dùng" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Số điện thoại" },
];

type Props = {
  userInfo: User | null;
};

const PersonalInfoForm = ({ userInfo }: Props) => {
  const { updateProfile } = useUserStore();
  const [formData, setFormData] = useState({
    displayName: "",
    username: "",
    phone: "",
    bio: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (userInfo) {
      setFormData({
        displayName: userInfo.displayName || "",
        username: userInfo.username || "",
        phone: userInfo.phone || "",
        bio: userInfo.bio || "",
      });
    }
  }, [userInfo]);

  if (!userInfo) return null;

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.displayName.trim()) {
      toast.error("Tên hiển thị không được để trống");
      return;
    }
    if (!formData.username.trim()) {
      toast.error("Tên người dùng không được để trống");
      return;
    }
    setIsSubmitting(true);
    try {
      await updateProfile({
        displayName: formData.displayName,
        username: formData.username,
        phone: formData.phone,
        bio: formData.bio,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="glass-strong border-border/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="size-5 text-primary" />
          Thông tin cá nhân
        </CardTitle>
        <CardDescription>
          Cập nhật chi tiết cá nhân và thông tin hồ sơ của bạn
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PERSONAL_FIELDS.map(({ key, label, type }) => {
            const isEmail = key === "email";
            return (
              <div
                key={key}
                className="space-y-2"
              >
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  type={type ?? "text"}
                  value={isEmail ? (userInfo.email ?? "") : (formData[key as keyof typeof formData] ?? "")}
                  onChange={(e) => !isEmail && handleChange(key, e.target.value)}
                  disabled={isEmail}
                  className="glass-light border-border/30 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Giới thiệu</Label>
          <Textarea
            id="bio"
            rows={3}
            value={formData.bio}
            onChange={(e) => handleChange("bio", e.target.value)}
            className="glass-light border-border/30 resize-none"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full md:w-auto bg-gradient-primary hover:opacity-90 transition-opacity"
        >
          {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoForm;