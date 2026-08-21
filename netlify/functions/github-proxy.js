// Ce fichier tourne UNIQUEMENT sur les serveurs de Netlify.
// Le navigateur ne le voit jamais et n'a jamais accès au token.

const GITHUB_USER = "spideyaxel";
const GITHUB_REPO = "112";
const GITHUB_BRANCH = "main";
const FILE_PATH = "actualites.json";

// ⚠️ Change ce mot de passe : c'est lui qui protège ton panel admin
// puisque le token n'est plus dans le HTML public.
const ADMIN_PASSWORD = "change-moi-un-mot-de-passe-solide";

exports.handler = async (event) => {

    // Autorise les appels depuis ton site GitHub Pages (CORS)
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, X-Admin-Password",
        "Access-Control-Allow-Methods": "GET, PUT, OPTIONS"
    };

    // Requête préliminaire du navigateur (CORS preflight)
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 204, headers, body: "" };
    }

    // Vérifie le mot de passe envoyé par admin.html
    const password = event.headers["x-admin-password"];
    if (password !== ADMIN_PASSWORD) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ message: "Mot de passe admin incorrect." })
        };
    }

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: "GITHUB_TOKEN manquant côté serveur." })
        };
    }

    const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${FILE_PATH}`;

    try {

        if (event.httpMethod === "GET") {

            const response = await fetch(`${url}?ref=${GITHUB_BRANCH}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28"
                }
            });

            const result = await response.json();
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify(result)
            };
        }

        if (event.httpMethod === "PUT") {

            const { content, sha, message } = JSON.parse(event.body || "{}");

            const response = await fetch(url, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/vnd.github+json",
                    "Content-Type": "application/json",
                    "X-GitHub-Api-Version": "2022-11-28"
                },
                body: JSON.stringify({
                    message: message || "Mise à jour actualites.json",
                    content,
                    sha,
                    branch: GITHUB_BRANCH
                })
            });

            const result = await response.json();
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify(result)
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ message: "Méthode non supportée." })
        };

    } catch (err) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: err.message })
        };
    }
};
