# Find instances of "TODO_FIND_LINE" and replace with the line number of the function definition as found in raw_github_file_url

for file in $(find src/ts/lib/manifold -name "*.ts"); do
    file_path=$file

    # Skip if the file is in playground/
    if [[ $file_path == */playground/* ]]; then
        continue
    fi

    # Get a line that contains TODO_FIND_LINE, and get the function name
    # The line will look like this:
    # /*LOGGER */ export const base64toPoints = logCall
    # ...and we want to extract base64toPoints in that example
    line_with_todo_find_line=$(grep -m 1 -n TODO_FIND_LINE $file | sed "s/\([0-9]*\):.*/\1/g")

    # Continue if we didn't find a line with TODO_FIND_LINE
    if [ -z "$line_with_todo_find_line" ]; then
        # echo "No line with TODO_FIND_LINE found in $file"
        continue
    fi

    echo $file

    # Get the text found at the raw_github_file_url variable in the header of the file
    raw_github_file_url=$(grep -m 1 raw_github_file_url $file | sed "s/.*raw_github_file_url *= *'\([^']*\)'.*/\1/g")
    echo "curl -s $raw_github_file_url"
    remote_file_text=$(curl -s $raw_github_file_url)

    # Keep going until there are no more lines with TODO_FIND_LINE
    while [ ! -z "$line_with_todo_find_line" ]; do
        # Get the function name, which is the word before the first = sign                                  # Get the last word
        function_name=$(sed -n "${line_with_todo_find_line}p" $file | sed "s/\([a-zA-Z0-9_]*\) *=.*/\1/g" | sed "s/.* \([a-zA-Z0-9_]*\)/\1/g")

        if [ -z "$function_name" ]; then
            echo "No function name found in $file on line $line_with_todo_find_line."
            echo "Line: $(sed -n "${line_with_todo_find_line}p" $file)"
            exit 1
        fi

        # Get the line number of the function definition in the remote file
        line_number=$(grep -m 1 -n " $function_name =" <<< "$remote_file_text" | sed "s/\([0-9]*\):.*/\1/g")
        if [ -z "$line_number" ]; then
            line_number=$(grep -m 1 -n "function $function_name<" <<< "$remote_file_text" | sed "s/\([0-9]*\):.*/\1/g")
        fi
        if [ -z "$line_number" ]; then
            line_number=$(grep -m 1 -n "function $function_name(" <<< "$remote_file_text" | sed "s/\([0-9]*\):.*/\1/g")
        fi

        if [ -z "$line_number" ]; then
            echo "No line number found for $function_name = in $file"
            echo "No line number found for function $function_name in $file"
            exit 1
        fi

        # Replace TODO_FIND_LINE with the line number, only once
        sed -i '0,/TODO_FIND_LINE/s//'"$line_number"'/' $file

        echo "Replaced TODO_FIND_LINE with $line_number in $file for function $function_name"

        # Get the next line with TODO_FIND_LINE
        line_with_todo_find_line=$(grep -m 1 -n TODO_FIND_LINE $file | sed "s/\([0-9]*\):.*/\1/g")
    done
done
