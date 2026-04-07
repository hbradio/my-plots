import { useAuth0 } from '@auth0/auth0-react'

export default function AuthButtons() {
  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0()

  if (isAuthenticated) {
    return (
      <span>
        {user?.email}{' '}
        <button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
          Log out
        </button>
      </span>
    )
  }

  return <button onClick={() => loginWithRedirect()}>Log in</button>
}
