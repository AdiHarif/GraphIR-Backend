
import fs from "fs"
import path from "path"
import { execSync } from "child_process"

beforeEach(() => {
    fs.rmSync("out", { recursive: true, force: true});
    fs.mkdirSync("out");
});


function compileAndRunFile(tsFile: string) {
    execSync(`npm start -- -i ../../${tsFile} -o ../../out -f csv`, { cwd: "submodules/TS-Graph-Extractor" });
    execSync(`souffle -D../../out -F../../out src/main.dl`, { cwd: "submodules/GraphIR-Static-Analysis" });

    const cppFile = `out/${path.basename(tsFile, '.ts')}.cpp`;
    execSync(`npm start -- -i ${tsFile} -o ${cppFile} -f cpp -t out/full_type.csv`);

    execSync(`clang++ -o out/main -Ilib ${cppFile} lib/*.cpp`);

    const output = execSync(`out/main`).toString();
    const expectedOutput = execSync(`npx tsx ${tsFile}`).toString();
    expect(output).toEqual(expectedOutput);
}


describe("End to end tests on all samples", () => {
    const dir = "tests/e2e_samples";
    const files = fs.readdirSync(dir);
    for (const file of files) {
        test(file, () => {
            compileAndRunFile(`${dir}/${file}`);
        });
    }
});
