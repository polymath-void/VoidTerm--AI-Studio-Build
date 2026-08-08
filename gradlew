#!/bin/sh

# Attempt to set APP_BASE_NAME and APP_HOME
PRG="$0"
while [ -h "$PRG" ] ; do
    ls=`ls -ld "$PRG"`
    link=`expr "$ls" : '.*-> \(.*\)$'`
    if expr "$link" : '/.*' > /dev/null; then
        PRG="$link"
    else
        PRG=`dirname "$PRG"`"/$link"
    fi
done
SAVED="`pwd`"
cd "`dirname \"$PRG\"`" >/dev/null
APP_HOME="`pwd`"
cd "$SAVED" >/dev/null

APP_NAME="Gradle"
APP_BASE_NAME=`basename "$0"`

# Locate the gradle-wrapper.jar
CLASSPATH=$APP_HOME/gradle/wrapper/gradle-wrapper.jar

# Download gradle-wrapper.jar if missing
if [ ! -f "$CLASSPATH" ]; then
    echo "gradle-wrapper.jar not found at $CLASSPATH. Downloading on the fly..."
    mkdir -p "$APP_HOME/gradle/wrapper"
    curl -sSLo "$CLASSPATH" "https://raw.githubusercontent.com/gradle/gradle/v8.5.0/gradle/wrapper/gradle-wrapper.jar" || \
    wget -qO "$CLASSPATH" "https://raw.githubusercontent.com/gradle/gradle/v8.5.0/gradle/wrapper/gradle-wrapper.jar" || {
        echo "ERROR: Failed to download gradle-wrapper.jar" >&2
        exit 1
    }
fi

# Find java
if [ -n "$JAVA_HOME" ] ; then
    if [ -x "$JAVA_HOME/bin/java" ] ; then
        JAVACMD="$JAVA_HOME/bin/java"
    else
        echo "ERROR: JAVA_HOME is set to an invalid directory: $JAVA_HOME" >&2
        exit 1
    fi
else
    JAVACMD="java"
    which java >/dev/null 2>&1 || {
        echo "ERROR: java command not found in PATH." >&2
        exit 1
    }
fi

# Execute Gradle
exec "$JAVACMD" \
    "-Dorg.gradle.appname=$APP_BASE_NAME" \
    -classpath "$CLASSPATH" \
    org.gradle.wrapper.GradleWrapperMain \
    "$@"
