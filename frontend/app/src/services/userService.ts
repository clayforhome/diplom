class UserService {
  public getUserIdForIntegrations(): string | null {
    return localStorage.getItem('integrationUserId')
  }

  public setUserIdForIntegrations(integrationUserId: string) {
    return localStorage.setItem('integrationUserId', integrationUserId)
  }
}

export default new UserService()
