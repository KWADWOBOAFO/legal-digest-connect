import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Scale, LogOut, User, Shield, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/hooks/useUserRole";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AuthDialog from "@/components/auth/AuthDialog";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const { user, profile, signOut, isLoading } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const publicNavLinks = [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Practice Areas", href: "#practice-areas" },
    { label: "For Law Firms", href: "#for-firms" },
  ];

  const adminNavLinks = [
    { label: "Firms", href: "/admin?tab=firms" },
    { label: "Cases", href: "/admin?tab=cases" },
    { label: "Users", href: "/admin?tab=users" },
    { label: "Activity Log", href: "/admin?tab=activity" },
  ];

  const navLinks = (user && isAdmin) ? adminNavLinks : publicNavLinks;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <a href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Scale className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-serif text-2xl font-bold text-foreground">
                DEBRIEFED
              </span>
            </a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) =>
                link.href.startsWith("/") ? (
                  <button
                    key={link.label}
                    onClick={() => navigate(link.href)}
                    className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    {link.label}
                  </button>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    {link.label}
                  </a>
                )
              )}
            </div>

            {/* CTA Buttons / User Menu */}
            <div className="hidden md:flex items-center gap-4">
              {isLoading ? (
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
              ) : user ? (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2 px-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                            {getInitials(profile?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium max-w-[150px] truncate">
                          {displayName}
                        </span>
                        {isAdmin && (
                          <Badge variant="destructive" className="ml-1 text-xs">Admin</Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      {isAdmin ? (
                        <DropdownMenuItem onClick={() => navigate('/admin')}>
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Panel
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                          <User className="mr-2 h-4 w-4" />
                          Dashboard
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => setAuthDialogOpen(true)}>
                    Sign In
                  </Button>
                  <Button variant="gold" onClick={() => setAuthDialogOpen(true)}>
                    Get Started
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              <div className="relative w-6 h-6">
                <X className={`w-6 h-6 text-foreground absolute inset-0 transition-all duration-300 ${isOpen ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0'}`} />
                <Menu className={`w-6 h-6 text-foreground absolute inset-0 transition-all duration-300 ${isOpen ? '-rotate-90 opacity-0' : 'rotate-0 opacity-100'}`} />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Mobile Menu Panel */}
      <div
        className={`fixed top-20 left-0 right-0 bottom-0 z-40 bg-background md:hidden transition-transform duration-300 ease-out ${isOpen ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          <div className="p-6 space-y-1">
            {navLinks.map((link, index) => (
              <a
                key={link.label}
                href={link.href.startsWith("/") ? undefined : link.href}
                onClick={(e) => {
                  if (link.href.startsWith("/")) {
                    e.preventDefault();
                    navigate(link.href);
                  }
                  setIsOpen(false);
                }}
                className="flex items-center justify-between py-4 px-3 rounded-xl text-foreground hover:bg-muted font-medium text-lg transition-all duration-200 group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {link.label}
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all duration-200" />
              </a>
            ))}
          </div>

          <div className="border-t border-border mx-6" />

          <div className="p-6 space-y-3">
            {user ? (
              <>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 mb-4">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-base">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-foreground truncate">{displayName}</span>
                    <span className="text-sm text-muted-foreground truncate">{user.email}</span>
                  </div>
                </div>
                {isAdmin ? (
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between h-12 text-base px-4 rounded-xl hover:bg-muted"
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/admin');
                    }}
                  >
                    <span className="flex items-center gap-3">
                      <Shield className="h-5 w-5" />
                      Admin Panel
                    </span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </Button>
                ) : (
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between h-12 text-base px-4 rounded-xl hover:bg-muted"
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/dashboard');
                    }}
                  >
                    <span className="flex items-center gap-3">
                      <User className="h-5 w-5" />
                      Dashboard
                    </span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </Button>
                )}
                <div className="pt-2">
                  <Button 
                    variant="outline"
                    className="w-full justify-center h-12 text-base rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      setIsOpen(false);
                      handleSignOut();
                    }}
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button 
                  variant="outline"
                  className="w-full justify-center h-12 text-base rounded-xl"
                  onClick={() => {
                    setIsOpen(false);
                    setAuthDialogOpen(true);
                  }}
                >
                  Sign In
                </Button>
                <Button 
                  variant="gold" 
                  className="w-full justify-center h-12 text-base rounded-xl"
                  onClick={() => {
                    setIsOpen(false);
                    setAuthDialogOpen(true);
                  }}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </>
  );
};

export default Navbar;
