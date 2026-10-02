export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export type ContributionInterest =
  | 'frontend'
  | 'backend'
  | 'full-stack'
  | 'documentation'
  | 'testing'
  | 'developer-tools'
  | 'performance'
  | 'accessibility'
  | 'devops';

export type ContributionExperience =
  | 'first-time'
  | 'some-experience'
  | 'experienced';

export interface DeveloperSkill {
  name: string;
  level: SkillLevel;
}

export interface NormalizedRepository {
  owner: string;
  name: string;
  url: string;
}

export interface DeveloperProfile {
  repository: NormalizedRepository;
  skills: DeveloperSkill[];
  interests: ContributionInterest[];
  availableHours: number;
  contributionExperience: ContributionExperience;
}

export interface RawProfileInput {
  repositoryUrl: string;
  skills: DeveloperSkill[];
  interests: string[];
  availableHours: number;
  contributionExperience: string;
}

export type ProfileFormState =
  | {
      status: 'editing';
      initialValues?: Partial<RawProfileInput>;
    }
  | {
      status: 'ready';
      profile: DeveloperProfile;
    };
