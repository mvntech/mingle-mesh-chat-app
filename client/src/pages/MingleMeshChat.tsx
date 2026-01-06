import useLogout from "../utils/logout.ts";

export function MingleMeshChat() {
    const logout = useLogout();

    return(
        <>
            <h1>Hello!</h1>
            <button onClick={logout}>Logout</button>
        </>
    );
}