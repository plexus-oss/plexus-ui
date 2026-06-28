import https from "https";

/**
 * Download file from URL with redirect support
 */
export async function downloadFile(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          // Follow redirect
          https.get(res.headers.location!, (res2) => {
            if (res2.statusCode !== 200) {
              reject(new Error(`Failed to download: ${res2.statusCode} ${res2.statusMessage}`));
              return;
            }
            let data = "";
            // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
            res2.on("data", (chunk) => (data += chunk));
            res2.on("end", () => resolve(data));
            res2.on("error", reject);
          });
        } else if (res.statusCode !== 200) {
          reject(new Error(`Failed to download: ${res.statusCode} ${res.statusMessage}`));
          return;
        } else {
          let data = "";
          // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => resolve(data));
          res.on("error", reject);
        }
      })
      .on("error", reject);
  });
}
