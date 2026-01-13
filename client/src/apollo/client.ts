import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

const httpLink = new HttpLink({
    uri: import.meta.env.VITE_API_URL,
});

const authLink = setContext((_, { headers }) => {
    const token = localStorage.getItem("token");
    return {
        headers: {
            ...headers,
            Authorization: token ? `Bearer ${token}` : "",
        },
    };
});

const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache({
        typePolicies: {
            Query: {
                fields: {
                    getMessages: {
                        keyArgs: ["chatId"],
                        merge(existing = [], incoming = [], { readField }) {
                            const merged = [...incoming];
                            const incomingIds = new Set(
                                incoming.map((ref: any) => readField("id", ref))
                            );
                            for (const item of existing) {
                                const id = readField("id", item);
                                if (!incomingIds.has(id)) {
                                    merged.push(item);
                                }
                            }
                            return merged;
                        },
                    },
                },
            },
        },
    }),
});

export default client;