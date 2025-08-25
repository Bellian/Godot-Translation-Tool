import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const USERNAME = process.env.BASIC_AUTH_USER || "admin";
const PASSWORD = process.env.BASIC_AUTH_PASS || "password";

export function middleware(request: NextRequest) {
    const authHeader = request.headers.get("authorization");
    if (authHeader) {
        const [type, credentials] = authHeader.split(" ");
        if (type === "Basic") {
            const [user, pass] = Buffer.from(credentials, "base64").toString().split(":");
            if (user === USERNAME && pass === PASSWORD) {
                return NextResponse.next();
            }
        }
        return new NextResponse("<h1>401 Unauthorized</h1><p>Invalid credentials.</p>", {
            status: 401,
            headers: {
                "WWW-Authenticate": "Basic realm=\"Secure Area\"",
                "Content-Type": "text/html",
            },
        });
    }
    // No auth header, prompt for credentials
    return new NextResponse("<h1>401 Unauthorized</h1><p>Authentication required.</p>", {
        status: 401,
        headers: {
            "WWW-Authenticate": "Basic realm=\"Secure Area\"",
            "Content-Type": "text/html",
        },
    });
}

export const config = {
    matcher: "/((?!_next|favicon.ico|public|api|static).*)",
};
