import {
  IntegrationStep,
  IntegrationStepExecutionContext,
  createIntegrationRelationship,
  createIntegrationEntity,
  Entity,
} from '@jupiterone/integration-sdk-core';
import listTeams from '../../api/listTeams';
import listTeamUsers from '../../api/listTeamUsers';
import { Teams } from '../../types';

const convertTeams = (teams: Teams): Entity[] =>
  teams.map((team) => {
    return createIntegrationEntity({
      entityData: {
        source: { team },
        assign: {
          _key: `npm-team:${team}`,
          _type: 'npm_team',
          _class: ['UserGroup'],
          id: team,
          name: team,
          displayName: team,
        },
      },
    });
  });

const step: IntegrationStep = {
  id: 'fetch-org-teams',
  name: 'Fetch Organization Teams',
  types: ['npm_team', 'npm_team_has_user'],
  async executionHandler({
    instance,
    jobState,
  }: IntegrationStepExecutionContext) {
    const teams = await listTeams(instance);
    await jobState.addEntities(convertTeams(teams));

    for (const team of teams) {
      const teamUsers = await listTeamUsers(team, instance);
      const teamUserRelationships = teamUsers.map((user) =>
        createIntegrationRelationship({
          fromType: 'npm_team',
          fromKey: `npm-team:${team}`,
          toType: 'npm_user',
          toKey: `npm-user:${user}`,
          _class: 'HAS',
        }),
      );
      await jobState.addRelationships(teamUserRelationships);
    }
  },
};

export default step;
