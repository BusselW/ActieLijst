let cachedDigest = null;
let digestExpiration = null;

/**
 * Functie om de X-RequestDigest dynamisch op te halen vanuit SharePoint.
 * @returns {Promise<string>} Een belofte die de waarde van het X-RequestDigest teruggeeft.
 */
async function getRequestDigest() {
    if (cachedDigest && digestExpiration > Date.now()) {
        return cachedDigest;
    }

    try {
        const response = await fetch("/sites/MulderT/_api/contextinfo", {
            method: "POST",
            headers: {
                "Accept": "application/json;odata=verbose",
                "Content-Type": "application/json;odata=verbose"
            }
        });

        if (!response.ok) {
            throw new Error(`Fout bij ophalen contextinfo: ${response.status}`);
        }

        const data = await response.json();
        cachedDigest = data.d.GetContextWebInformation.FormDigestValue;
        digestExpiration = Date.now() + data.d.GetContextWebInformation.FormDigestTimeoutSeconds * 1000;

        return cachedDigest;
    } catch (error) {
        console.error("[RequestDigest] Fout bij ophalen van contextinfo:", error.message);
        throw error;
    }
}

/**
 * Functie om een API-call te doen met een geldig X-RequestDigest.
 * @param {string} url De URL van de API.
 * @param {Object} options Extra fetch-opties zoals headers, body, etc.
 * @param {boolean} retry Geeft aan of de functie opnieuw moet proberen bij een fout (default: false).
 * @returns {Promise<Response>} De fetch response belofte.
 */
async function apiCallWithDigest(url, options = {}, retry = false) {
    let digest;

    try {
        digest = await getRequestDigest();
    } catch (error) {
        console.error("[API] Kan geen geldig X-RequestDigest ophalen:", error.message);
        throw error;
    }

    try {
        const headers = {
            ...options.headers,
            "X-RequestDigest": digest,
            "Accept": "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose"
        };

        const response = await fetch(url, { ...options, headers });

        if (!response.ok) {
            // Specifiek gedrag voor een 403 fout
            if (response.status === 403 && !retry) {
                console.warn("[API] X-RequestDigest verlopen of machtiging geweigerd. Ophalen nieuw ticket...");
                cachedDigest = null; // Reset cache
                return apiCallWithDigest(url, options, true); // Eén herhaalpoging
            }

            const errorDetails = await response.text(); // Extra details uit de response halen
            throw new Error(`Fout bij API-aanroep: ${response.status} - ${response.statusText}. Details: ${errorDetails}`);
        }

        return response;
    } catch (error) {
        if (error.message.includes("403")) {
            console.error("[API] Permanente fout: onvoldoende machtigingen of ongeldig X-RequestDigest.");
        } else {
            console.error("[API] Technische fout:", error.message);
        }
        throw error;
    }
}

// Maak functies globaal beschikbaar
window.getRequestDigest = getRequestDigest;
window.apiCallWithDigest = apiCallWithDigest;
