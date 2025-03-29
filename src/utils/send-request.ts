import BadRequestError from "../errors/bad-request.error";

export const sendRequest = async (
    url: string,
    config: any,
    errorMessage: string
) => {
    console.log(url);
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
    });
    if (!response.ok) throw new BadRequestError(errorMessage);
};
