
// import React from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { Button } from '@/components/ui/button';
// import { 
//   Package, 
//   ShoppingCart, 
//   Receipt, 
//   FileText, 
//   BarChart3, 
//   LogOut,
//   Menu,
//   X
// } from 'lucide-react';
// import { useState } from 'react';
// import { useAuth } from '@/contexts/AuthContext';
// import { useToast } from '@/hooks/use-toast';

// export const Navbar = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//   const { signOut } = useAuth();
//   const { toast } = useToast();

//   const navItems = [
//     { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
//     { path: '/inventory', label: 'Inventory', icon: Package },
//     { path: '/sales', label: 'Sales', icon: ShoppingCart },
//     { path: '/expense', label: 'Expenses', icon: Receipt },
//     { path: '/reports', label: 'Reports', icon: FileText },
//     { path: '/AdvancedAnalytics', label: 'AdvancedAnalytics', icon: FileText },
//     { path: '/customer-pos', label: 'CustomerPOSPage', icon: FileText },
//   ];

//   const isActive = (path: string) => location.pathname === path;

//   const handleLogout = async () => {
//     try {
//       await signOut();
//       toast({
//         title: "Success",
//         description: "Logged out successfully"
//       });
//       navigate('/');
//     } catch (error) {
//       toast({
//         title: "Error",
//         description: "Failed to log out",
//         variant: "destructive"
//       });
//     }
//   };

//   return (
//     <nav className="bg-white shadow-sm border-b border-gray-200">
//       <div className="container mx-auto px-4">
//         <div className="flex items-center justify-between h-16">
//           {/* Logo */}
//           <div className="flex items-center space-x-2">
//             <div className="bg-blue-600 p-2 rounded-lg">
//               <Package className="h-6 w-6 text-white" />
//             </div>
//             <span className="text-xl font-bold text-gray-900">VendorFlow</span>
//           </div>

//           {/* Desktop Navigation */}
//           <div className="hidden md:flex items-center space-x-1">
//             {navItems.map((item) => (
//               <Button
//                 key={item.path}
//                 variant={isActive(item.path) ? "default" : "ghost"}
//                 onClick={() => navigate(item.path)}
//                 className="flex items-center space-x-2"
//               >
//                 <item.icon className="h-4 w-4" />
//                 <span>{item.label}</span>
//               </Button>
//             ))}
//           </div>

//           {/* Desktop Logout */}
//           <div className="hidden md:block">
//             <Button variant="outline" onClick={handleLogout} className="flex items-center space-x-2">
//               <LogOut className="h-4 w-4" />
//               <span>Logout</span>
//             </Button>
//           </div>

//           {/* Mobile Menu Button */}
//           <Button
//             variant="ghost"
//             size="icon"
//             className="md:hidden"
//             onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
//           >
//             {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
//           </Button>
//         </div>

//         {/* Mobile Navigation */}
//         {isMobileMenuOpen && (
//           <div className="md:hidden border-t border-gray-200 py-4">
//             <div className="space-y-2">
//               {navItems.map((item) => (
//                 <Button
//                   key={item.path}
//                   variant={isActive(item.path) ? "default" : "ghost"}
//                   onClick={() => {
//                     navigate(item.path);
//                     setIsMobileMenuOpen(false);
//                   }}
//                   className="w-full justify-start flex items-center space-x-2"
//                 >
//                   <item.icon className="h-4 w-4" />
//                   <span>{item.label}</span>
//                 </Button>
//               ))}
//               <Button
//                 variant="outline"
//                 onClick={handleLogout}
//                 className="w-full justify-start flex items-center space-x-2 mt-4"
//               >
//                 <LogOut className="h-4 w-4" />
//                 <span>Logout</span>
//               </Button>
//             </div>
//           </div>
//         )}
//       </div>
//     </nav>
//   );
// };
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  ShoppingCart, 
  Receipt, 
  FileText, 
  BarChart3, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext'; // <-- Import useAuth
import { useToast } from '@/hooks/use-toast';

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { signOut, isAdmin } = useAuth(); // <-- Get isAdmin from the context
  const { toast } = useToast();

  // --- Define different navigation items based on role ---
  const adminNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/inventory', label: 'Inventory', icon: Package },
    { path: '/sales', label: 'Sales', icon: ShoppingCart },
    { path: '/expense', label: 'Expenses', icon: Receipt },
    { path: '/reports', label: 'Reports', icon: FileText },
    { path: '/AdvancedAnalytics', label: 'Analytics', icon: BarChart3 },
  ];

 const customerNavItems = [
    { path: '/customer-dashboard', label: 'My Dashboard', icon: BarChart3 },
    { path: '/sales', label: 'Create Sale', icon: ShoppingCart },
  ];

  const navItems = isAdmin ? adminNavItems : customerNavItems;

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Success",
        description: "Logged out successfully"
      });
      navigate('/auth'); // Navigate to auth page on logout
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive"
      });
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">VendorFlow</span>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={isActive(item.path) ? "default" : "ghost"}
                onClick={() => navigate(item.path)}
                className="flex items-center space-x-2"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Button>
            ))}
          </div>

          <div className="hidden md:block">
            <Button variant="outline" onClick={handleLogout} className="flex items-center space-x-2">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? "default" : "ghost"}
                  onClick={() => {
                    navigate(item.path);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full justify-start flex items-center space-x-2"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              ))}
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full justify-start flex items-center space-x-2 mt-4"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};