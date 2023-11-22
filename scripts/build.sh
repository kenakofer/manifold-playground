npx webpack || exit 1

# Copy all files that have changed from the src/ directory, except for the src/ts/ directory
rsync -av --exclude 'ts' src/ dist/ || exit 1
