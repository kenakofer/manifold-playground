npx webpack || exit 1

# Copy all files that have changed from the src/ directory, except for the src/ts/ directory
rsync -av --exclude 'ts' src/ dist/ || exit 1

# Check that git is totally clean
if [ -n "$(git status --porcelain)" ]; then
  echo "Git is not clean, commit your changes and try again."
  exit 1
fi

cd dist || exit 1

# Check that the branch in this subtree is gh-pages
if [ "$(git rev-parse --abbrev-ref HEAD)" != "gh-pages" ]; then
  echo "Not on gh-pages branch, aborting."
  exit 1
fi

git add . || exit 1
git commit -m "Deployed to Github Pages" || exit 1
git push origin gh-pages || exit 1
