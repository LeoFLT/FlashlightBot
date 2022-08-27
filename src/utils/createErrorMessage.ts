export default function (input: string, index: number): string {
    return "```diff\n" + input + "\n-" + " ".repeat(index - 1) + "^```";
}