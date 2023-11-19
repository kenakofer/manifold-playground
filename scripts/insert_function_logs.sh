# There are different ways functions are declared:
#    export async function withRetries<T>(...
#    export function calculateCpmmMultiArbitrageSellYes(
#    export const mapAsyncChunked = async <T, U>(...
#    const computeFill = (
#
# We're going to change these so that they are wrapped in a logCall(), like so
#    export const withRetries = logCall(`Entering ${u('withRetries()', 26)}`, _withRetries)
#    export async function _withRetries<T>(...

for file in $(find src/ts/lib/manifold -name "*.ts"); do
    file_path=$file

    echo $file

    # Skip if the file is in playground/
    if [[ $file_path == */playground/* ]]; then
        continue
    fi

    # Wrap the form: export async function withRetries<T>(...
    sed -i "s/^\(export \)\?\(async \)\?function \([a-zA-Z0-9][a-zA-Z0-9_]*\)/\/*LOG1   *\/ \1const \3 = logCall('Entering ' + codeUrl('\3()', github_file_url, TODO_FIND_LINE), _\3);\n\/*WRAPPED*\/ \1\2function _\3/g" $file

    # Wrap the form export const mapAsyncChunked = async <T, U>(...
    # Specifically, one of async, (, or < must follow the = sign to distinguish from variable declarations
    sed -i "s/^\(export \)\?const \([a-zA-Z0-9][a-zA-Z0-9_]*\) *= *\(\(async\)\|\((\)\|\(<\)\)/\/*LOG1   *\/ \1const \2 = logCall('Entering ' + codeUrl('\2()', github_file_url, TODO_FIND_LINE), _\2);\n\/*WRAPPED*\/ \1const _\2 = \3/g" $file

    # Use vim to move all lines containing /*LOG1   */ to the end of the function

    # Check with grep
    counter=0
    while grep -q "LOG1" $file; do
        # Moves the LOG1 line to after the function definition, and makes it LOG2
        vim -N -u NONE -n -c "set nomore" -s scripts/test.keys $file
        # BREAK if it takes too many tries
        counter=$((counter+1))
        if [[ $counter -gt 100 ]]; then
            echo "Too many tries on file $file"
            exit 1
        fi
    done
done
