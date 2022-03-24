// @ts-check

/** @type boolean */
let hasRepoScope;

/**
 * An Octoherd script to delete repositories
 *
 * @param {import('@octoherd/cli').Octokit} octokit
 * @param {import('@octoherd/cli').Repository} repository
 */
export async function script(octokit, repository) {
  if (!hasRepoScope) {
    const { headers } = await octokit.request("HEAD /");
    const scopes = new Set(headers["x-oauth-scopes"].split(", "));

    if (!scopes.has("repo")) {
      throw new Error(
        `The "repo" scope is required for this script. Create a token at https://github.com/settings/tokens/new?scopes=repo then run the script with "-T <paste token here>"`
      );
    }
    hasRepoScope = true;
  }

  const archived = await octokit.request("PATCH /repos/{owner}/{repo}", {
    owner: repository.owner.login,
    repo: repository.name,
    data: {
      archived: true,
    }
  })
    .then(() => true)
    .catch(error => {
      // error.message: Repository was archived so is read-only
      if (error.status === 403 && error.message.includes("archived")) {
        octokit.log.warn(`Repository is already archived`);
        return false;
      }

      throw error;
    })

  if (archived) {
    octokit.log.info("Repository archived");
  }
}
