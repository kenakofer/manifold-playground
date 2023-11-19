
# Iterate over every .ts file in src/ts/lib/manifold
for file in $(find src/ts/lib/manifold -name "*.ts"); do
    file_path=$file

    # Skip if the file is in playground/
    if [[ $file_path == playground/* ]]; then
        continue
    fi

    # Remove the src/ts/lib/manifold/common/src/ prefix
    file_path=${file_path#src/ts/lib/manifold/common/src/}

    # If the file is in playground/, skip it
    if [[ $file_path == playground/* ]]; then
        continue
    fi

    # If the file already has import { NestedLogger, logCall, codeUrl }, skip it
    if grep -q "import { NestedLogger, logCall, codeUrl } from" $file; then
        continue
    fi

    # Need to go up one ../ for every additional directory in the path
    DOT_COUNT=$(echo $file_path | grep -o "/" | wc -l)
    if [[ $DOT_COUNT -gt 0 ]]; then
        DOT_STRING="../"
    else
        DOT_STRING="./"
    fi

    IMPORT_STATEMENTS="import { PlaygroundState } from '${DOT_STRING}playground/playground-state'\nimport { NestedLogger, logCall, codeUrl } from '${DOT_STRING}playground/nested-logger'\ndeclare global { interface Window { logger: NestedLogger\; pState: PlaygroundState } }\n"
    # Prepare the IMPORT_STATEMENTS so it can be used in sed

    echo $file

    # Prepend the import statements to the file
    sed -i "1s;^;$IMPORT_STATEMENTS;" $file
done
