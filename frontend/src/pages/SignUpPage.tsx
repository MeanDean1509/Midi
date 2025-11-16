import { SignupForm } from '@/components/signup-form'
import React from 'react'

const SignUpPage = () => {
  return (
     <div className="flex flex-col items-center justify-center p-6 bg-muted min-h-svh md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <SignupForm />
      </div>
    </div>
  )
}

export default SignUpPage;
