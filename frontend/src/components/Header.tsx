import { Button } from "@/components/ui/button";
import { ShoppingCart, User, Package, LogOut, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { NavLink } from "./NavLink";
import { NotificationCenter } from "./NotificationCenter";

interface HeaderProps {
  userRole?: 'customer' | 'operator' | 'admin';
}

const Header = ({ userRole = 'customer' }: HeaderProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success("已退出登录");
    navigate("/auth");
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <h1 
            className="text-2xl font-bold bg-gradient-ai bg-clip-text text-transparent cursor-pointer"
            onClick={() => navigate('/')}
          >
            AI智能商城
          </h1>
          
          {userRole === 'customer' && (
            <nav className="hidden md:flex gap-6">
              <NavLink to="/">首页</NavLink>
              <NavLink to="/products">商品</NavLink>
            </nav>
          )}

          {userRole === 'operator' && (
            <nav className="hidden md:flex gap-6">
              <NavLink to="/operator">运营中心</NavLink>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2">
          {user && <NotificationCenter />}
          <Button variant="ghost" size="icon" onClick={() => navigate('/favorites')}>
            <Heart className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate('/cart')}>
            <ShoppingCart className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate('/orders')}>
            <Package className="h-5 w-5" />
          </Button>
          {user ? (
            <>
              <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
                <User className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => navigate('/auth')}>
              <User className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;