export default {
    toI: (value: number|string) => (typeof value === "string") ? parseInt(value) : value
};
