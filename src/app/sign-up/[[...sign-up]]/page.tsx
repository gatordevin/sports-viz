import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Create Your Account</h2>
          <p className="mt-2 text-gray-400">Join StatFlow for professional sports analytics</p>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-dark-900 border border-white/10',
            },
          }}
        />
      </div>
    </div>
  )
}
