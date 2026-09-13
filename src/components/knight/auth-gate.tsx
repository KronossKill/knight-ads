'use client'

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Lock, Shield, Eye, EyeOff, X, UserPlus, LogIn, Gem, Fingerprint, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export interface AuthUser {
  email: string
  name: string
  role: "anunciante" | "visitante"
  loggedInAt: number
}

/**
 * AuthGate — modal that blocks portal operations until the user registers/logs in.
 * Demo only: no real backend auth. On submit, calls onAuth(user).
 */
export function AuthGate({
  open,
  requiredRole,
  onAuth,
  onClose,
}: {
  open: boolean
  requiredRole: "anunciante" | "visitante"
  onAuth: (user: AuthUser) => void
  onClose?: () => void
}) {
  const [tab, setTab] = useState<"login" | "register">("register")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error("Completa email y contraseña")
      return
    }
    if (tab === "register" && !name) {
      toast.error("Indica tu nombre para continuar")
      return
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error("Email inválido")
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      const user: AuthUser = {
        email,
        name: name || email.split("@")[0],
        role: requiredRole,
        loggedInAt: Date.now(),
      }
      onAuth(user)
      toast.success(`¡Bienvenido, ${user.name}! Sesión iniciada como ${requiredRole}.`)
      // reset
      setEmail(""); setName(""); setPassword("")
    }, 700)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="relative w-full max-w-md"
          >
            <div className="glass-strong rounded-2xl border border-border/60 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="relative px-6 pt-6 pb-4 border-b border-border/60 bg-gradient-to-br from-amber-500/10 to-violet-500/10">
                <div className="absolute right-3 top-3">
                  {onClose && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} aria-label="Cerrar">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-gold text-primary-foreground shadow-lg glow-gold">
                    <Shield className="h-5 w-5" strokeWidth={2.4} />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold leading-tight">
                      {tab === "register" ? "Regístrate para continuar" : "Inicia sesión"}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Acceso requerido para rol: <span className="font-semibold text-primary capitalize">{requiredRole}</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="border-amber-500/30 text-amber-300 gap-1"><Gem className="h-3 w-3" /> Token $Knight</Badge>
                  <Badge variant="outline" className="gap-1"><Fingerprint className="h-3 w-3" /> Anti-bot</Badge>
                </div>
              </div>

              {/* Tabs + form */}
              <div className="p-6">
                <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")}>
                  <TabsList className="grid w-full grid-cols-2 mb-5">
                    <TabsTrigger value="register" className="gap-1.5"><UserPlus className="h-3.5 w-3.5" /> Registrarse</TabsTrigger>
                    <TabsTrigger value="login" className="gap-1.5"><LogIn className="h-3.5 w-3.5" /> Iniciar sesión</TabsTrigger>
                  </TabsList>
                  <form onSubmit={submit} className="space-y-4">
                    <TabsContent value="register" className="space-y-4 m-0">
                      <Field id="name" label="Nombre completo" icon={<UserPlus className="h-4 w-4" />}>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" autoComplete="name" className="pl-10" />
                      </Field>
                    </TabsContent>
                    <TabsContent value="login" className="space-y-4 m-0" />
                    {/* common fields */}
                    <Field id="email" label="Email" icon={<Mail className="h-4 w-4" />}>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" autoComplete="email" className="pl-10" />
                    </Field>
                    <Field id="password" label="Contraseña" icon={<Lock className="h-4 w-4" />}>
                      <div className="relative">
                        <Input id="password" type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete={tab === "register" ? "new-password" : "current-password"} className="pl-10 pr-10" />
                        <button type="button" onClick={() => setShowPass((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showPass ? "Ocultar" : "Mostrar"}>
                          {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </Field>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Shield className="h-3 w-3" />
                      Verificación anti-bot habilitada. Tus datos quedan cifrados en la wallet del sistema.
                    </div>
                    <Button type="submit" disabled={loading} className="w-full bg-gradient-gold text-primary-foreground font-semibold gap-2">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : tab === "register" ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                      {tab === "register" ? "Crear cuenta" : "Entrar"}
                    </Button>
                  </form>
                </Tabs>
                <p className="mt-4 text-center text-[11px] text-muted-foreground">
                  Al continuar aceptas los <button className="text-primary hover:underline">Términos</button> y la <button className="text-primary hover:underline">Política de Privacidad</button>.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Field({ id, label, icon, children }: { id: string; label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        {children}
      </div>
    </div>
  )
}
