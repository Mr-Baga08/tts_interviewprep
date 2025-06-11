// frontend/src/components/layout/navbar.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Menu,
  X,
  User,
  Settings,
  LogOut,
  BrainCircuit,
  Code,
  FileText,
  MessageSquare,
  BarChart3,
  Crown,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ShowIf } from '@/components/auth/route-guard'

const navigationItems = [
  {
    title: 'Features',
    href: '#',
    submenu: [
      { title: 'AI Interviews', href: '/interviews', icon: MessageSquare },
      { title: 'Coding Challenges', href: '/challenges', icon: Code },
      { title: 'Resume Review', href: '/resumes', icon: FileText },
      { title: 'Mock Tests', href: '/tests', icon: BrainCircuit },
      { title: 'Analytics', href: '/analytics', icon: BarChart3 },
    ]
  },
  { title: 'Pricing', href: '/pricing' },
  { title: 'About', href: '/about' },
  { title: 'Contact', href: '/contact' },
]

export function Navbar() {
  const { user, isAuthenticated, signOut, hasRole, isPremium } = useAuth()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isActivePath = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <BrainCircuit className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">TheTruthSchool</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <div key={item.title} className="relative group">
                {item.submenu ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="flex items-center space-x-1 hover:text-primary"
                      >
                        <span>{item.title}</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      {item.submenu.map((subItem) => {
                        const Icon = subItem.icon
                        return (
                          <DropdownMenuItem key={subItem.title} asChild>
                            <Link 
                              href={subItem.href}
                              className="flex items-center space-x-2"
                            >
                              <Icon className="h-4 w-4" />
                              <span>{subItem.title}</span>
                            </Link>
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary",
                      isActivePath(item.href) 
                        ? "text-primary" 
                        : "text-muted-foreground"
                    )}
                  >
                    {item.title}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Right Side - Auth & User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Premium Badge */}
                <ShowIf premium>
                  <Badge variant="secondary" className="hidden sm:flex items-center space-x-1">
                    <Crown className="h-3 w-3" />
                    <span>Pro</span>
                  </Badge>
                </ShowIf>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.image} alt={user?.name} />
                        <AvatarFallback>
                          {user?.name?.slice(0, 2).toUpperCase() || 'UN'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user?.name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                        <div className="flex items-center space-x-2 pt-1">
                          <Badge variant="outline" className="text-xs">
                            {user?.role}
                          </Badge>
                          {isPremium && (
                            <Badge variant="secondary" className="text-xs">
                              <Crown className="h-3 w-3 mr-1" />
                              Pro
                            </Badge>
                          )}
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>

                    <ShowIf role="admin">
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center">
                          <Crown className="mr-2 h-4 w-4" />
                          <span>Admin Panel</span>
                        </Link>
                      </DropdownMenuItem>
                    </ShowIf>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={handleSignOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/register">Get Started</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center space-x-2">
                      <BrainCircuit className="h-5 w-5" />
                      <span>TheTruthSchool</span>
                    </SheetTitle>
                  </SheetHeader>
                  
                  <div className="mt-6 flow-root">
                    <div className="space-y-2">
                      {/* User Info (Mobile) */}
                      {isAuthenticated && user && (
                        <div className="border-b pb-4 mb-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.image} alt={user.name} />
                              <AvatarFallback>
                                {user.name?.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{user.name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {user.role}
                                </Badge>
                                {isPremium && (
                                  <Badge variant="secondary" className="text-xs">
                                    Pro
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Navigation Links */}
                      {navigationItems.map((item) => (
                        <div key={item.title}>
                          {item.submenu ? (
                            <div className="space-y-1">
                              <p className="font-medium text-sm text-muted-foreground px-3 py-2">
                                {item.title}
                              </p>
                              {item.submenu.map((subItem) => {
                                const Icon = subItem.icon
                                return (
                                  <Link
                                    key={subItem.title}
                                    href={subItem.href}
                                    className="flex items-center space-x-2 px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                  >
                                    <Icon className="h-4 w-4" />
                                    <span>{subItem.title}</span>
                                  </Link>
                                )
                              })}
                            </div>
                          ) : (
                            <Link
                              href={item.href}
                              className={cn(
                                "block px-3 py-2 text-sm rounded-md",
                                isActivePath(item.href)
                                  ? "bg-accent text-accent-foreground"
                                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                              )}
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              {item.title}
                            </Link>
                          )}
                        </div>
                      ))}

                      {/* Auth Actions (Mobile) */}
                      {isAuthenticated ? (
                        <div className="border-t pt-4 space-y-2">
                          <Link
                            href="/dashboard"
                            className="flex items-center space-x-2 px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <BarChart3 className="h-4 w-4" />
                            <span>Dashboard</span>
                          </Link>
                          <Link
                            href="/profile"
                            className="flex items-center space-x-2 px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <User className="h-4 w-4" />
                            <span>Profile</span>
                          </Link>
                          <Link
                            href="/settings"
                            className="flex items-center space-x-2 px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Settings className="h-4 w-4" />
                            <span>Settings</span>
                          </Link>
                          <ShowIf role="admin">
                            <Link
                              href="/admin"
                              className="flex items-center space-x-2 px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <Crown className="h-4 w-4" />
                              <span>Admin Panel</span>
                            </Link>
                          </ShowIf>
                          <button
                            onClick={() => {
                              handleSignOut()
                              setIsMobileMenuOpen(false)
                            }}
                            className="flex items-center space-x-2 px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground text-destructive w-full text-left"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>Sign out</span>
                          </button>
                        </div>
                      ) : (
                        <div className="border-t pt-4 space-y-2">
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start"
                            asChild
                          >
                            <Link 
                              href="/auth/login"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              Sign in
                            </Link>
                          </Button>
                          <Button 
                            className="w-full justify-start"
                            asChild
                          >
                            <Link 
                              href="/auth/register"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              Get Started
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}