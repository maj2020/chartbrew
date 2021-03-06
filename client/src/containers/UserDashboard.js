import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import {
  Divider, Dimmer, Loader, Form, Modal, Header, Message, Container,
  Button, Icon, Grid, Card, Step, TransitionablePortal,
} from "semantic-ui-react";

import { getTeams, createTeam, saveActiveTeam } from "../actions/team";
import { getUser, relog as relogAction } from "../actions/user";
import { cleanErrors as cleanErrorsAction } from "../actions/error";
import ProjectForm from "../components/ProjectForm";
import InviteMembersForm from "../components/InviteMembersForm";
import Invites from "../components/Invites";
import Navbar from "../components/Navbar";
import canAccess from "../config/canAccess";

/*
  The user dashboard with all the teams and projects
*/
function UserDashboard(props) {
  const {
    relog, cleanErrors, user, getTeams, createTeam, saveActiveTeam,
    history, teams,
  } = props;

  const [loading, setLoading] = useState(false);
  const [createTeamModal, setCreateTeamModal] = useState(false);
  const [addMembersModal, setAddMembersModal] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [name, setName] = useState("");
  const [addProject, setAddProject] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [retried, setRetried] = useState(false);

  useEffect(() => {
    cleanErrors();
    relog();
    _getTeams();
  }, []);

  useEffect(() => {
    if (!fetched && user.data.id && !user.loading) {
      _getTeams();
    }
  }, [user]);

  useEffect(() => {
    if (teams.length > 0) {
      if (teams[0].Projects && teams[0].Projects.length === 0) {
        _onNewProject(teams[0]);
      }
    }
  }, [teams]);

  const _getTeams = () => {
    setFetched(true);
    setLoading(true);
    getTeams(user.data.id)
      .then(() => {
        setLoading(false);
      })
      .catch(() => {
        if (!retried) {
          _getTeams();
        }
        setLoading(false);
        setRetried(true);
      });
  };

  const handleChange = (e, { value }) => setName(value);

  const _createTeam = () => {
    setLoading(true);
    createTeam(user.data.id, name)
      .then((newTeam) => {
        // set team to saveActiveTeam
        saveActiveTeam(newTeam);
        setLoading(false);
        setCreateTeamModal(false);
        setAddMembersModal(true);
        setName("");
      }).catch(() => {
        setSubmitError(true);
        setLoading(false);
      });
  };

  const _onNewProject = (team) => {
    setAddProject(true);
    saveActiveTeam(team);
  };

  const _onProjectCreated = (project) => {
    getTeams(user.data.id);
    setAddProject(false);
    history.push(`/${project.team_id}/${project.id}/dashboard?new=true`);
  };

  const directToProject = (team, projectId) => {
    saveActiveTeam(team);
    history.push(`/${team.id}/${projectId}/dashboard`);
  };

  const _canAccess = (role, teamRoles) => {
    return canAccess(role, user.data.id, teamRoles);
  };

  /* Modal to invite team members  */
  const invitationModal = () => {
    return (
      <Modal
        open={addMembersModal}
        onClose={() => setAddMembersModal(false)}
        size="small"
        closeIcon
      >
        <InviteMembersForm
          skipTeamInvite={() => setAddMembersModal(false)}
        />
      </Modal>
    );
  };

  /* Modal to create new team  */
  const newTeamModal = () => {
    return (
      <Modal
        open={createTeamModal}
        onClose={() => setCreateTeamModal(false)}
        size="mini"
        closeIcon
        >
        <Modal.Header> Create a new Team </Modal.Header>
        <Modal.Content>
          <Form onSubmit={_createTeam}>
            <Form.Input label="Team name *" placeholder="Enter a name for your team" name="name" value={name} onChange={handleChange} />
            <Divider />
            {submitError
            && (
            <Container textAlign="center" style={{ margin: "1em" }}>
              <Message negative> There was an error creating a new team. </Message>
            </Container>
            )}
            <Form.Button loading={loading} disabled={!name} type="submit" floated="right" compact size="large" primary icon labelPosition="right">
              {" "}
              Submit
              <Icon name="arrow right" />
              {" "}
            </Form.Button>
          </Form>
        </Modal.Content>
        <Divider hidden />
      </Modal>
    );
  };

  const newProjectModal = () => {
    return (
      <TransitionablePortal open={addProject}>
        <Modal
          open={addProject}
          onClose={() => setAddProject(false)}
          size="small"
          closeIcon
        >
          <Modal.Content>
            {teams[0] && teams[0].Projects && teams[0].Projects.length === 0 && (
              <div>
                <Step.Group fluid>
                  <Step active>
                    <Icon name="hand point down outline" />
                    <Step.Content>
                      <Step.Title>Project</Step.Title>
                      <Step.Description>Create your first project</Step.Description>
                    </Step.Content>
                  </Step>
                  <Step disabled>
                    <Step.Content>
                      <Step.Title>Connect</Step.Title>
                      <Step.Description>Connect to your data source</Step.Description>
                    </Step.Content>
                  </Step>
                  <Step disabled>
                    <Step.Content>
                      <Step.Title>Visualize</Step.Title>
                      <Step.Description>Create your first chart</Step.Description>
                    </Step.Content>
                  </Step>
                </Step.Group>
                <Header as="h2">{"Let's get you started"}</Header>
                <p>{"In Chartbrew you can have multiple projects and each one has a different dashboard and data source connections."}</p>
                <p>{"To get started, name your first project below and then we'll move on to setting up your first data source connection."}</p>
                <Divider hidden />
              </div>
            )}
            <ProjectForm onComplete={_onProjectCreated} />
          </Modal.Content>
        </Modal>
      </TransitionablePortal>
    );
  };

  if (!user.data.id) {
    return (
      <div style={styles.container}>
        <Dimmer active={loading}>
          <Loader />
        </Dimmer>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Navbar hideTeam transparent />
      <Container textAlign="center" style={styles.mainContent}>
        <Divider hidden />
        {loading && <Loader inverted active={loading} />}

        <Invites />
        {newTeamModal()}
        {invitationModal()}
        {newProjectModal()}

        {teams && teams.map((key) => {
          return (
            <Container
              textAlign="left"
              key={key.id}
              style={styles.teamContainer}
            >
              <Header
                textAlign="left"
                as="h2"
                inverted
                style={styles.teamHeader}
                title={`${key.TeamRoles.length} member${key.TeamRoles.length > 1 ? "s" : ""}`}
              >
                <Icon name={key.TeamRoles.length > 1 ? "users" : "user"} size="small" />
                <Header.Content>{key.name}</Header.Content>
              </Header>
              {_canAccess("admin", key.TeamRoles)
                && (
                <Button
                  style={styles.settingsBtn}
                  size="small"
                  basic
                  inverted
                  icon
                  floated="right"
                  labelPosition="right"
                  as={Link}
                  to={`/manage/${key.id}/members`}
                >
                  <Icon name="settings" />
                  Team settings
                </Button>
                )}
              {key.TeamRoles[0] && key.TeamRoles.map((teamRole) => {
                return (
                  teamRole.user_id === user.data.id
                    && (
                      <span key={teamRole.user_id}>
                        <Header style={styles.listRole} content={teamRole.role} />
                      </span>
                    )
                );
              })}

              <Card.Group itemsPerRow={4} style={styles.cardsContainer}>
                {key.Projects && key.Projects.map((project) => {
                  return (
                    <Card
                      style={styles.projectContainer}
                      key={project.id}
                      onClick={() => directToProject(key, project.id)}
                      className="project-segment"
                    >
                      <Card.Header textAlign="center" as="h3" style={styles.cardHeader}>
                        {project.name}
                      </Card.Header>
                      <Card.Content>
                        <Grid columns={2} centered>
                          <Grid.Column textAlign="center" style={styles.iconColumn}>
                            <Container textAlign="center" title="Number of connections">
                              <Icon name="plug" size="large" />
                              <span>{project.Connections && project.Connections.length}</span>
                            </Container>
                          </Grid.Column>
                          <Grid.Column textAlign="center" style={styles.iconColumn}>
                            <Container textAlign="center" title="Number of charts">
                              <Icon name="chart line" size="large" />
                              <span>{project.Charts.length}</span>
                            </Container>
                          </Grid.Column>
                        </Grid>
                      </Card.Content>
                    </Card>
                  );
                })}
                {_canAccess("admin", key.TeamRoles)
                  && (
                    <Card
                      style={{ ...styles.projectContainer, ...styles.addProjectCard }}
                      onClick={() => _onNewProject(key)}
                      className="project-segment"
                    >
                      <Card.Header textAlign="center" as="h3" style={styles.cardHeader}>
                        Create new project
                      </Card.Header>
                      <Card.Content>
                        <Header textAlign="center" as="h2">
                          <Icon name="plus" size="large" color="orange" />
                        </Header>
                      </Card.Content>
                    </Card>
                  )}

              </Card.Group>
              {key.Projects && key.Projects.length === 0 && !_canAccess("admin", key.TeamRoles)
                && (
                  <Message>
                    <p>
                      {"This team doesn't have any projects yet."}
                    </p>
                  </Message>
                )}
            </Container>
          );
        })}
      </Container>
    </div>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: "#103751",
    minHeight: window.innerHeight,
  },
  listContent: {
    cursor: "pointer",
  },
  listItem: {
    margin: "4em",
  },
  listRole: {
    color: "white",
    fontSize: "13px"
  },
  card: {
    backgroundColor: "white",
  },
  blueSection: {
    backgroundColor: "#103751",
    borderColor: "#103751",
  },
  mainContent: {
    backgroundColor: "#103751",
    borderColor: "#103751",
    paddingTop: 50,
  },
  violetSection: {
    backgroundColor: "#1a7fa0",
    borderColor: "#1a7fa0",
  },
  teamContainer: {
    marginTop: 50,
  },
  projectContainer: {
    textAlign: "center",
    cursor: "pointer",
  },
  cardsContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  cardHeader: {
    paddingTop: 10,
    color: "black",
  },
  teamHeader: {
    display: "inline",
  },
  settingsBtn: {
    marginLeft: 20,
  },
  addProjectCard: {
    opacity: 0.7,
  },
  iconColumn: {
    color: "black",
  },
};

UserDashboard.propTypes = {
  user: PropTypes.object.isRequired,
  teams: PropTypes.array.isRequired,
  getTeams: PropTypes.func.isRequired,
  createTeam: PropTypes.func.isRequired,
  saveActiveTeam: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired,
  relog: PropTypes.func.isRequired,
  cleanErrors: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => {
  return {
    user: state.user,
    teams: state.team.data,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    getUser: (id) => dispatch(getUser(id)),
    getTeams: (userId) => dispatch(getTeams(userId)),
    createTeam: (userId, name) => dispatch(createTeam(userId, name)),
    saveActiveTeam: (team) => dispatch(saveActiveTeam(team)),
    relog: () => dispatch(relogAction()),
    cleanErrors: () => dispatch(cleanErrorsAction()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(UserDashboard);
