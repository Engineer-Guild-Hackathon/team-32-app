import { ProfileSetup } from "@/components/profile-setup"
import { LogoutButton } from "@/components/logout-button"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-end mb-4">
          <LogoutButton />
        </div>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">Fashion Diagnosis & Style Learning</h1>
          <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
            パーソナル診断を通じて、あなたに最適なファッションスタイルを学びましょう
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <ProfileSetup />
        </div>
      </div>
    </main>
  )
}
