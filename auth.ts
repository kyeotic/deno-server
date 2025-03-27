import { createRemoteJWKSet, jwtVerify } from '@panva/jose'
import urlJoin from 'url-join'

/** A JWT Token */
export interface Token {
  iss: string
  sub: string
  aud: string[]
  iat: number
  exp: number
  scope: string
  azp: string
}

/**
 * Create a verifier that internally caches JWKS keys and validates bearer token strings
 * against the configured `issuer` and `audience`.
 *
 * `jwksUrl` is optional, and created from the `issuer` if it is not provided.
 */
export function createJwtVerifier({
  issuer,
  jwksUrl,
  audience,
}: {
  issuer: string
  /** Url for the JWKS enpdoint.
   *
   * Defaults to \`${issuer}/.well-known/jwks.json\` */
  jwksUrl?: string
  audience: string
}): (jwt: string) => Promise<Token> {
  const jwksEndpoint = new URL(
    jwksUrl ?? urlJoin(issuer, '/.well-known/jwks.json')
  )
  const JWKS = createRemoteJWKSet(jwksEndpoint)

  return async function verifyJwt(jwt: string): Promise<Token> {
    const { payload } = await jwtVerify(jwt.replace('Bearer ', ''), JWKS, {
      issuer,
      audience,
    })
    return payload as unknown as Token
  }
}
