import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { User, MapPin, Shield, Trash2, Plus, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Address {
  id: string;
  receiver_name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  is_default: boolean;
}

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
  });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [newAddress, setNewAddress] = useState({
    receiver_name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail: '',
  });
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchAddresses();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const fetchAddresses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update(profile)
        .eq('id', user.id);

      if (error) throw error;
      toast.success('个人信息已更新');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.receiver_name || !newAddress.phone || !newAddress.detail) {
      toast.error('请填写完整地址信息');
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('addresses')
        .insert({
          ...newAddress,
          user_id: user.id,
          is_default: addresses.length === 0,
        });

      if (error) throw error;

      toast.success('地址已添加');
      setShowAddAddress(false);
      setNewAddress({
        receiver_name: '',
        phone: '',
        province: '',
        city: '',
        district: '',
        detail: '',
      });
      fetchAddresses();
    } catch (error) {
      console.error('Failed to add address:', error);
      toast.error('添加失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Unset all defaults
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Set new default
      await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', id);

      toast.success('默认地址已更新');
      fetchAddresses();
    } catch (error) {
      console.error('Failed to set default:', error);
      toast.error('操作失败');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('地址已删除');
      fetchAddresses();
    } catch (error) {
      console.error('Failed to delete address:', error);
      toast.error('删除失败');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.auth.admin.deleteUser(user.id);
      await supabase.auth.signOut();
      toast.success('账户已注销');
      navigate('/auth');
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error('注销失败，请联系客服');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header userRole="customer" />

      <div className="container px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">个人中心</h1>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              个人信息
            </TabsTrigger>
            <TabsTrigger value="addresses">
              <MapPin className="h-4 w-4 mr-2" />
              收货地址
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              安全设置
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>姓名</Label>
                  <Input
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="请输入姓名"
                  />
                </div>
                <div className="space-y-2">
                  <Label>邮箱</Label>
                  <Input
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="请输入邮箱"
                    type="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label>手机号</Label>
                  <Input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="请输入手机号"
                  />
                </div>
                <Button onClick={handleUpdateProfile} disabled={loading}>
                  {loading ? '保存中...' : '保存更改'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="addresses">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>我的地址</CardTitle>
                  <Button size="sm" onClick={() => setShowAddAddress(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    新增地址
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {addresses.map((address) => (
                  <Card key={address.id} className="relative">
                    <CardContent className="p-4">
                      {address.is_default && (
                        <div className="absolute top-2 right-2">
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                            默认
                          </span>
                        </div>
                      )}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{address.receiver_name}</span>
                          <span className="text-muted-foreground">{address.phone}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {address.province} {address.city} {address.district} {address.detail}
                        </p>
                        <div className="flex gap-2 pt-2">
                          {!address.is_default && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleSetDefaultAddress(address.id)}
                            >
                              设为默认
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteAddress(address.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            删除
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {showAddAddress && (
                  <Card className="border-dashed">
                    <CardContent className="p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>收货人</Label>
                          <Input
                            value={newAddress.receiver_name}
                            onChange={(e) => setNewAddress({ ...newAddress, receiver_name: e.target.value })}
                            placeholder="请输入收货人姓名"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>手机号</Label>
                          <Input
                            value={newAddress.phone}
                            onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                            placeholder="请输入手机号"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>省份</Label>
                          <Input
                            value={newAddress.province}
                            onChange={(e) => setNewAddress({ ...newAddress, province: e.target.value })}
                            placeholder="省份"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>城市</Label>
                          <Input
                            value={newAddress.city}
                            onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                            placeholder="城市"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>区县</Label>
                          <Input
                            value={newAddress.district}
                            onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })}
                            placeholder="区县"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>详细地址</Label>
                        <Input
                          value={newAddress.detail}
                          onChange={(e) => setNewAddress({ ...newAddress, detail: e.target.value })}
                          placeholder="街道、门牌号等详细地址"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddAddress} disabled={loading}>
                          {loading ? '保存中...' : '保存地址'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowAddAddress(false)}
                        >
                          取消
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>账户安全</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">修改密码</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    定期修改密码可以提高账户安全性
                  </p>
                  <Button variant="outline">修改密码</Button>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2 text-destructive">注销账户</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    注销账户后，所有数据将被永久删除且无法恢复
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        注销账户
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认注销账户？</AlertDialogTitle>
                        <AlertDialogDescription>
                          此操作将永久删除您的账户和所有相关数据，且无法恢复。您确定要继续吗？
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive">
                          确认注销
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
