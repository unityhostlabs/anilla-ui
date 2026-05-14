import { execSync } from 'child_process';

function run(command) {
    try {
        return execSync(command, { stdio: 'inherit' });
    } catch (error) {
        console.error(`❌ Execution failed for command: ${command}`);
        process.exit(1);
    }
}

// 1. Ensure git workspace is clean so you don't accidentally release uncommitted work
const status = execSync('git status --porcelain').toString().trim();
if (status) {
    console.error('❌ Clean your Git working directory before releasing alpha versions.');
    process.exit(1);
}

console.log('📦 Bumping prerelease version...');
run('npm version prerelease --preid=alpha');

console.log('🚀 Bundling and publishing alpha package to npm...');
// The package.json publishConfig will automatically catch the "alpha" tag and public access
run('npm publish');

console.log('🔥 Pushing new git tags to remote repository...');
run('git push && git push --tags');

console.log('🎉 Successfully published next alpha build!');
