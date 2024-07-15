
import fs from "fs"
import path from "path"
import { execSync } from "child_process"

beforeEach(() => {
    fs.rmSync("out", { recursive: true, force: true});
    fs.mkdirSync("out");
});


function compileAndRunFile(tsFile: string) {
    execSync(`npm start -- -i ../../${tsFile} -o ../../out -f csv`, { cwd: "submodules/TS-Graph-Extractor" });
    execSync(`souffle -D../../out -F../../out post_processing.dl`, { cwd: "submodules/GraphIR-Static-Analysis" });

    const llvmIrFile = `out/${path.basename(tsFile, '.ts')}.ll`;
    execSync(`npm start -- -i ${tsFile} -o ${llvmIrFile} -t out/full_type.csv --instantiate-libs`);

    execSync(`llvm-link -S out/*.ll lib/*.ll -o out/linked.ll`);
    execSync(`llc -filetype=obj out/linked.ll -o out/main.o`);
    execSync(`clang++ out/main.o -o out/main`);

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
