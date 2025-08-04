import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Sun } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import Logo from "@/icons/Logo"
import { useAuthAppContext } from "@/contexts/auth-context"
const BarTop = () => {
    const { logout } = useAuth({
        middleware: 'auth',
        redirectIfAuthenticated: '/',
    })
    const { user } = useAuthAppContext()

    return (
        <div className="w-full fixed top-0 bg-background  border-b">
            <div className="w-full flex justify-between items-center h-12 max-w-3xl mx-auto bg-background">

                <div className="w-auto h-8 flex items-center">
                    <Logo className="h-6 w-auto" />
                </div>


                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Avatar>
                            <AvatarImage className="w-6 h-6" src={user?.avatar} />
                            {/* <AvatarFallback className="text-xs">CN</AvatarFallback> */}
                            <AvatarFallback className="text-xs">{user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-40 rounded-lg" align="end">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuGroup>
                            <DropdownMenuItem onClick={logout}>
                                <LogOut />
                                Logout
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Sun />
                                Theme
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>



            </div>
        </div>
    )
}

export default BarTop