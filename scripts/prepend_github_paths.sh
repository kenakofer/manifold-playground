# Description: Prepend github paths to all .ts files in src/ts/lib/manifold
MANIFOLD_GIT_SHA='74ab5cae';

GITHUB_DOMAIN_PREFIX='https://github.com/manifoldmarkets/manifold/blob/'$MANIFOLD_GIT_SHA'/'
RAW_GITHUB_PREFIX='https://raw.githubusercontent.com/manifoldmarkets/manifold/'$MANIFOLD_GIT_SHA'/'


# Iterate over every .ts file in src/ts/lib/manifold
for file in $(find src/ts/lib/manifold -name "*.ts"); do
    github_path=$file

    # We'll change the file path into the github path by a series of replacements
    # 1. Remove the src/ts/lib/manifold/common/src/ prefix
    github_path=${github_path#src/ts/lib/manifold/common/src/}

    # If the file is in playground/, skip it
    if [[ $github_path == playground/* ]]; then
        continue
    fi

    # 2. If the path starts with api/ with "backend/api/src/"
    if [[ $github_path == api/* ]]; then
        github_path="backend/api/src/${github_path#api/}"
    # 3. If the path starts with helpers/ with "backend/shared/src/helpers"
    elif [[ $github_path == helpers/* ]]; then
        github_path="backend/shared/src/helpers/${github_path#helpers/}"
    # 4. If the path starts with trigger/ with "backend/functions/src/triggers"
    elif [[ $github_path == trigger/* ]]; then
        github_path="backend/functions/src/triggers/${github_path#trigger/}"
    else
        # Otherwise, prepend with "common/src/"
        github_path="common/src/$github_path"
    fi



    # Prepend the github path to the file if it doesn't contain "^const github_path"
    if ! grep -q "^const github_file_url" $file; then
        # Ensure that fetching the url isn't a 404
        if ! curl --output /dev/null --silent --head --fail "$GITHUB_DOMAIN_PREFIX$github_path"; then
            echo "ERROR: $GITHUB_DOMAIN_PREFIX$github_path is a 404"
            exit 1
        fi

        echo "Prepending github file url to $file"
        sed -i "1s;^;const github_file_url = \'$GITHUB_DOMAIN_PREFIX$github_path\'\n;" $file
    fi
    # Prepend the raw github path to the file if it doesn't contain "^const raw_github_path"
    if ! grep -q "^const raw_github_file_url" $file; then
        # Ensure that fetching the url isn't a 404
        if ! curl --output /dev/null --silent --head --fail "$RAW_GITHUB_PREFIX$github_path"; then
            echo "ERROR: $RAW_GITHUB_PREFIX$github_path is a 404"
            exit 1
        fi


        echo "Prepending raw github file url to $file"
        sed -i "1s;^;const raw_github_file_url = \'$RAW_GITHUB_PREFIX$github_path\'\n;" $file
    fi
done
