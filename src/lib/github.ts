/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/lib/github.ts
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

export const getGitHubConfig = () => {
  const username = localStorage.getItem("af_github_username") || "craighckby-stack";
  const repoName = localStorage.getItem("af_github_repo") || "god-virus";
  const token = sessionStorage.getItem("af_github_token") || 
                localStorage.getItem("af_github_token") || "";

  return {
    username,
    repoName,
    token,
    hasValidToken: token.length > 15,
    isDemoMode: username === "craighckby-stack" && repoName === "god-virus"
  };
};
