import React from 'react'
import { Button } from '../ui/button'
import { useAuthStore } from '@/stores/useAuthStore'
import { useNavigate } from 'react-router';
import { LogOut } from 'lucide-react';

const logout = () => {

    const {signOut} = useAuthStore();
    const navigate = useNavigate();
    const handleLogout = async () => {
        try {

            await signOut();
            navigate('/signin');
            
        } catch (error) {
            console.log(error);
        }
    }
  return (
    <Button className='cursor-pointer' variant="completeGhost" onClick={handleLogout}>
      <LogOut className='text-destructive'/>
      Đăng xuất
    </Button>
  )
}

export default logout