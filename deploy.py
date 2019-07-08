import os
import sys
import subprocess
import argparse

# GLOBAL CONSTANTS

core_name = "content-explorer-core"
db_name = "content-explorer-db"

container_config_path = "/etc/linkurator/config"
container_workdir = "/usr/src/app"

core_image_tag = "%s:latest" % (core_name,)
db_image_tag = "%s:latest" % (db_name,)

# GLOBAL VARIABLES

dry_run = False

core_container_name = ""
db_container_name = ""

# FUNCTIONS

def perror(message):
    print >> sys.stderr, "[ERROR] " + message
    exit(1)

def run_command(cmd):
    if (dry_run):
        print " ".join(cmd)
    else:
        try:
            subprocess.check_call(cmd, stderr=subprocess.STDOUT)
        except subprocess.CalledProcessError as e:
            perror(e.output)

def count_containers(container):
    docker_ps = subprocess.Popen(["sudo", "docker", "ps", "-qa", "--filter", "name=^%s$" % (container,)], stdout=subprocess.PIPE)
    return int(subprocess.check_output(["wc", "-l"], stdin=docker_ps.stdout))

def count_images(image):
    docker_images = subprocess.Popen(["sudo", "docker", "images", "-q", "--filter", "reference=%s" % (image,)], stdout=subprocess.PIPE)
    return int(subprocess.check_output(["wc", "-l"], stdin=docker_images.stdout))

def rebuild_core_container():
    print "\n# CORE CONTAINER"

    # Remove containers
    print "\n## REMOVE PREVIOUS CONTAINER\n"

    ps_count = count_containers(core_container_name)

    if(ps_count == 1):
        run_command(["sudo", "docker", "rm", "-f", core_container_name])

    # Remove images
    print "\n## REMOVE PREVIOUS IMAGE\n"

    images_count = count_images(core_image_tag)

    if(images_count == 1):
        run_command(["sudo", "docker", "rmi", "-f", core_image_tag])

    # Create images
    print "\n## BUILD NEW IMAGE\n"

    run_command(["sudo", "docker", "build", "-t", core_image_tag, "."])

    # Create containers
    print "\n## CREATE NEW CONTAINER\n"

    if(env == "DEV"):
        run_command(["sudo", "docker", "create", "-it", "--network", "host",
        "--name", core_container_name, "-v", "%s:%s" % (config_path, container_config_path),
        "-v", "%s:%s" % (os.getcwd(), container_workdir), core_image_tag, "/bin/sh"])

    elif(env == "PRO"):
        run_command(["sudo", "docker", "run", "-d", "-p", "3000:3000", "--name",
        core_container_name, "-v", "%s:%s" % (config_path, container_config_path), core_image_tag])

def rebuild_db_container():
    print "\n# DB CONTAINER"

    # Remove containers
    print "\n## REMOVE PREVIOUS CONTAINER\n"

    ps_count = count_containers(db_container_name)

    if(ps_count == 1):
        run_command(["sudo", "docker", "rm", "-f", db_container_name])

    # Remove images
    print "\n## REMOVE PREVIOUS IMAGE\n"

    images_count = count_images(db_image_tag)

    if(images_count == 1):
        run_command(["sudo", "docker", "rmi", "-f", db_image_tag])

    # Create images
    print "\n## BUILD NEW IMAGE\n"

    run_command(["sudo", "docker", "build", "-t", db_image_tag, "./db"])

    # Create containers
    print "\n## CREATE NEW CONTAINER\n"

    if(env == "DEV"):
        run_command(["sudo", "docker", "run", "-d", "--network", "host",
        "--name", db_container_name, db_image_tag])

    elif(env == "PRO"):
        run_command(["sudo", "docker", "run", "-d", "-p", "27017:27017", "--name",
        db_container_name, db_image_tag])
    
# MAIN

# Arguments parsing
parser = argparse.ArgumentParser(description='Script to deploy the project')
parser.add_argument('--env', choices=['DEV', 'PRO'], required=True,
                    help='Environment to deploy')
parser.add_argument('--config', required=True,
                    help='Path the directory that contains the configuration files')
parser.add_argument('--clear', action='store_true',
                    help='Clear persistent data')
parser.add_argument('--dry-run', action='store_true',
                    help='Display commands that will be executed without executing them')

args = parser.parse_args()

env = args.env
config_path = os.path.abspath(args.config)
clear = args.clear
dry_run = args.dry_run

core_container_name = core_name + "-" + env
db_container_name = db_name + "-" + env

# Check configuration directory

if (os.path.isdir(config_path)):
    if (not os.path.exists(config_path + "/core.env")):
        perror("Configuration file core.env does not exist")
    if (not os.path.exists(config_path + "/cert.pem")):
        perror("Certificate file cert.pem does not exist")
    if (not os.path.exists(config_path + "/key.pem")):
        perror("Private key file key.pem does not exist")
else:
    perror("Configuration directory does not exist")

# DB container
if(clear):
    rebuild_db_container()

# Core Container
rebuild_core_container()

if(env == "DEV"):
    run_command(["ln", "-sfn", "%s/core.env" % (container_config_path,), ".env"])

if (env == "DEV"):
    print "\n\
Run the following commands:\n\
sudo docker start -i %s\n\
npm install\n\
npm start\n" % (core_container_name,)
