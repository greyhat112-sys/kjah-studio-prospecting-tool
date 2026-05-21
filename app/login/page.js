'use client'
import { useActionState } from 'react'
import { login } from './actions'
import styles from './login.module.css'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null)

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <p className={styles.label}>KJAH STUDIO</p>
        <h1 className={styles.title}>Prospecting</h1>
        <form action={formAction} className={styles.form}>
          <input
            type="password"
            name="password"
            placeholder="Password"
            className={styles.input}
            autoFocus
            required
          />
          {state?.error && <p className={styles.error}>{state.error}</p>}
          <button type="submit" className={styles.btn} disabled={pending}>
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  )
}
