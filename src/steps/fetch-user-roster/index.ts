import {
  IntegrationStep,
  IntegrationStepExecutionContext,
} from '@jupiterone/integration-sdk-core';
import listUserRoster from '../../api/listUserRoster';
import {
  createIntegrationEntity,
  Entity,
} from '@jupiterone/integration-sdk-core';
import { Roster, OrganizationRole } from '../../types';

type User = {
  username: string;
  organizationRole: OrganizationRole;
};

const convertRoster = (roster: Roster): Entity[] =>
  Object.keys(roster).map((username: string) => {
    const organizationRole = roster[username];
    const user: User = {
      username,
      organizationRole,
    };
    return createIntegrationEntity({
      entityData: {
        source: user,
        assign: {
          _key: `npm-user:${username}`,
          _type: 'npm_user',
          _class: 'User',
          id: username,
          name: username,
          displayName: username,
          role: organizationRole,
          admin: organizationRole !== 'developer',
        },
      },
    });
  });

const step: IntegrationStep = {
  id: 'fetch-org-users',
  name: 'Fetch Organization Users',
  entities: [
    {
      resourceName: 'User',
      _type: 'npm_user',
      _class: ['User'],
    },
  ],
  relationships: [],
  async executionHandler({
    instance,
    jobState,
  }: IntegrationStepExecutionContext) {
    const userRoster = await listUserRoster(instance);
    await jobState.addEntities(convertRoster(userRoster));
  },
};

export default step;
