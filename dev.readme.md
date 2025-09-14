# **AsteroidJourney Development Notes**

## **Branching Strategy**

### **Primary branches**

#### **Develop**

Used to integrate feature branches and other development changes while keeping a full commit history.

#### **Main**

Contains the latest, functional production code. The develop branch is squash-merged into the main branch when changes have been fully integrated and tested, and are ready for production.

#### **Deploy**

This is an orphan branch. It is used for deployments, and is only concerned with deployment directories and files. CloudFlare tracks and updates deployments based on new commits in this branch.
At the time of writing this document, this branch only tracks the "out" directory and it its contents.

### **Flows**

#### **Feature flow**

Feature branches are created from the develop branch, then merged back into the develop branch with full history. No squash merges are used.

#### **Bug fix flow**

Bug fixes follow the same strategy as features.

#### **Hotfix flow**

A hotfix branch can be created from the main branch then merged back into main and then develop--possibly with merge conflicts when merged with develop.

#### **Production/release flow**

When the latest changes have been fully integrated and tested in "develop" and are ready for production, a certain procedure must be followed to merge and synchronize the "develop" and "main" branches.

1. First, ensure that any hotfix or other changes applied to the "main" branch are properly integrated into the develop branch.
2. Then, squash merge the develop branch into the main branch.
3. Finally, merge the main branch back into develop to unify the branch histories.

#### **Deployment flow**

To deploy the latest production code:

1. Build the project and pack the deployment files into the "out" directory.
2. Checkout to the "deploy" branch.
3. Stage and commit the latest changes with a deployment message.
4. Push to remote
CloudFlare will detect the latest push to the remote branch and will use the latest working deployment.
This process is automated with a "deploy" script.
