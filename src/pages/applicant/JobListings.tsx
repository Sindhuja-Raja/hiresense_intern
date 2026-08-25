import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { jobsApi, applicationsApi, profileApi, Job, Profile } from '@/lib/api';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Briefcase,
  MapPin,
  Clock,
  Calendar,
  Loader2,
  Search,
  Send,
  Star,
  Check,
  ChevronsUpDown,
} from 'lucide-react';

// Simplified Job Listings - Basic job viewing and applying

interface JobWithMatch extends Job {
  matchScore: number;
  skillMatchPercent: number;
  experienceFit: 'met' | 'below' | 'above';
  locationMatch: 'high' | 'medium' | 'low';
}

interface FilterOption {
  value: string;
  label: string;
}

interface SearchableFilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  placeholder: string;
  allLabel: string;
}

const SearchableFilterSelect = ({
  value,
  onChange,
  options,
  placeholder,
  allLabel,
}: SearchableFilterSelectProps) => {
  const [open, setOpen] = useState(false);
  const selectedLabel = value === 'all'
    ? allLabel
    : options.find((option) => option.value === value)?.label || placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>No matching option.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value={allLabel}
                onSelect={() => {
                  onChange('all');
                  setOpen(false);
                }}
              >
                <Check className={cn('mr-2 h-4 w-4', value === 'all' ? 'opacity-100' : 'opacity-0')} />
                {allLabel}
              </CommandItem>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', value === option.value ? 'opacity-100' : 'opacity-0')} />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const JobListings = () => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filterCatalogJobs, setFilterCatalogJobs] = useState<Job[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [skillsFilter, setSkillsFilter] = useState('');
  const [salaryMinFilter, setSalaryMinFilter] = useState('');
  const [salaryMaxFilter, setSalaryMaxFilter] = useState('');
  const [experienceMinFilter, setExperienceMinFilter] = useState('');
  const [experienceMaxFilter, setExperienceMaxFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'recent' | 'match'>('match');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [knockoutAnswers, setKnockoutAnswers] = useState<{question: string, answer: string}[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchJobs();
    fetchMyApplications();
    fetchProfile();
    fetchFilterCatalogJobs();
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [searchTerm, skillsFilter, salaryMinFilter, salaryMaxFilter, experienceMinFilter, experienceMaxFilter, locationFilter, employmentTypeFilter]);

  const fetchProfile = async () => {
    try {
      const response = await profileApi.getProfile();
      if (response.data?.user) {
        setProfile(response.data.user);
      }
    } catch {
      // Profile is optional for matching display.
    }
  };

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const response = await jobsApi.getActive({
        search: searchTerm || undefined,
        skills: skillsFilter || undefined,
        salaryMin: salaryMinFilter ? Number(salaryMinFilter) : undefined,
        salaryMax: salaryMaxFilter ? Number(salaryMaxFilter) : undefined,
        experienceMin: experienceMinFilter ? Number(experienceMinFilter) : undefined,
        experienceMax: experienceMaxFilter ? Number(experienceMaxFilter) : undefined,
        location: locationFilter || undefined,
        employmentType: employmentTypeFilter !== 'all' ? employmentTypeFilter : undefined,
      });
      if (response.data?.jobs) {
        setJobs(response.data.jobs);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch jobs',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyApplications = async () => {
    try {
      const response = await applicationsApi.getMyApplications();
      if (response.data?.applications) {
        const applied = new Set(response.data.applications.map((app: any) => 
          (app.jobId as any)?._id || app.jobId
        ));
        setAppliedJobs(applied);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    }
  };

  const fetchFilterCatalogJobs = async () => {
    try {
      const response = await jobsApi.getActive();
      if (response.data?.jobs) {
        setFilterCatalogJobs(response.data.jobs);
      }
    } catch (error) {
      console.error('Failed to fetch filter catalog jobs:', error);
    }
  };

  const handleApply = async () => {
    if (!selectedJob) return;

    if (selectedJob.knockoutQuestions && selectedJob.knockoutQuestions.length > 0) {
      if (knockoutAnswers.length !== selectedJob.knockoutQuestions.length) {
        toast({
          title: 'Required',
          description: 'Please answer all questions before applying.',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      setIsApplying(true);
      await applicationsApi.apply(selectedJob._id, coverLetter, undefined, knockoutAnswers.length > 0 ? knockoutAnswers : undefined);
      
      setAppliedJobs(new Set([...appliedJobs, selectedJob._id]));
      setShowApplyDialog(false);
      setCoverLetter('');
      setKnockoutAnswers([]);
      
      toast({
        title: 'Success',
        description: 'Application submitted successfully!',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit application',
        variant: 'destructive',
      });
    } finally {
      setIsApplying(false);
    }
  };

  const normalizeSkill = (value: string): string => value.toLowerCase().replace(/[.\-_/]/g, ' ').trim();

  const parseExperienceYears = (value?: string): number | null => {
    if (!value) return null;
    const matches = value.match(/(\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:years?|yrs?)/gi);
    if (!matches || matches.length === 0) {
      const fallback = value.match(/\b(\d+(?:\.\d+)?)\b/g);
      if (!fallback || fallback.length === 0) return null;
      return Math.max(...fallback.map(Number));
    }
    return Math.max(...matches.map((m) => Number((m.match(/\d+(?:\.\d+)?/) || ['0'])[0])));
  };

  const calculateMatch = (job: Job): JobWithMatch => {
    const requiredSkillsRaw = job.skillsRequired || [];
    const requiredSkills = requiredSkillsRaw.map(normalizeSkill);
    const candidateSkills = (profile?.skills || []).map(normalizeSkill);

    const matchedSkills = requiredSkills.filter((required) =>
      candidateSkills.some((candidate) => candidate.includes(required) || required.includes(candidate))
    );

    const skillMatchPercent = requiredSkills.length === 0
      ? 100
      : Math.round((matchedSkills.length / requiredSkills.length) * 100);

    const candidateYears = parseExperienceYears(profile?.experience);
    const minExp = job.experienceMin;
    const maxExp = job.experienceMax;

    let experienceFit: 'met' | 'below' | 'above' = 'met';
    if (typeof candidateYears === 'number') {
      if (typeof minExp === 'number' && candidateYears < minExp) {
        experienceFit = 'below';
      } else if (typeof maxExp === 'number' && candidateYears > maxExp) {
        experienceFit = 'above';
      }
    } else if (typeof minExp === 'number') {
      experienceFit = 'below';
    }
    const experienceScore = experienceFit === 'met' ? 100 : experienceFit === 'above' ? 90 : 40;

    const candidateLocation = (profile?.location || '').toLowerCase().trim();
    const jobLocation = (job.location || '').toLowerCase().trim();
    const locationMatch: 'high' | 'medium' | 'low' = !candidateLocation || !jobLocation
      ? 'medium'
      : (jobLocation.includes('remote') || candidateLocation.includes(jobLocation) || jobLocation.includes(candidateLocation))
        ? 'high'
        : 'low';
    const locationScore = locationMatch === 'high' ? 100 : locationMatch === 'medium' ? 70 : 30;

    const matchScore = Math.round((skillMatchPercent * 0.6) + (experienceScore * 0.3) + (locationScore * 0.1));

    return {
      ...job,
      matchScore,
      skillMatchPercent,
      experienceFit,
      locationMatch,
    };
  };

  const scoredJobs = useMemo(() => {
    const enriched = jobs.map((job) => calculateMatch(job));
    if (sortBy === 'match') {
      return enriched.sort((a, b) => b.matchScore - a.matchScore);
    }
    return enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [jobs, profile, sortBy]);

  const jobsForFilterOptions = useMemo(
    () => (filterCatalogJobs.length > 0 ? filterCatalogJobs : jobs),
    [filterCatalogJobs, jobs]
  );

  const availableSkills = useMemo(() => {
    return Array.from(
      new Set(
        jobsForFilterOptions
          .flatMap((job) => job.skillsRequired || [])
          .map((skill) => skill.trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [jobsForFilterOptions]);

  const availableLocations = useMemo(() => {
    return Array.from(
      new Set(
        jobsForFilterOptions
          .map((job) => job.location?.trim())
          .filter((location): location is string => Boolean(location))
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [jobsForFilterOptions]);

  const availableEmploymentTypes = useMemo(() => {
    return Array.from(
      new Set(
        jobsForFilterOptions
          .map((job) => job.employmentType?.trim())
          .filter((employmentType): employmentType is string => Boolean(employmentType))
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [jobsForFilterOptions]);

  const skillsOptions = useMemo(
    () => availableSkills.map((skill) => ({ value: skill, label: skill })),
    [availableSkills]
  );

  const locationOptions = useMemo(
    () => availableLocations.map((location) => ({ value: location, label: location })),
    [availableLocations]
  );

  const employmentTypeOptions = useMemo(
    () => availableEmploymentTypes.map((employmentType) => ({ value: employmentType, label: employmentType })),
    [availableEmploymentTypes]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Job Listings</h1>
        <p className="text-muted-foreground">Discover and apply to available positions</p>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search jobs by title, description, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <SearchableFilterSelect
            value={skillsFilter || 'all'}
            onChange={(value) => setSkillsFilter(value === 'all' ? '' : value)}
            options={skillsOptions}
            placeholder="Skills"
            allLabel="All Skills"
          />
          <Select value={salaryMinFilter || 'all'} onValueChange={(value) => setSalaryMinFilter(value === 'all' ? '' : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Min Salary" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Min Salary</SelectItem>
              <SelectItem value="30000">30,000+</SelectItem>
              <SelectItem value="50000">50,000+</SelectItem>
              <SelectItem value="80000">80,000+</SelectItem>
              <SelectItem value="100000">100,000+</SelectItem>
              <SelectItem value="150000">150,000+</SelectItem>
            </SelectContent>
          </Select>
          <Select value={salaryMaxFilter || 'all'} onValueChange={(value) => setSalaryMaxFilter(value === 'all' ? '' : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Max Salary" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Max Salary</SelectItem>
              <SelectItem value="50000">Up to 50,000</SelectItem>
              <SelectItem value="80000">Up to 80,000</SelectItem>
              <SelectItem value="120000">Up to 120,000</SelectItem>
              <SelectItem value="150000">Up to 150,000</SelectItem>
              <SelectItem value="200000">Up to 200,000</SelectItem>
            </SelectContent>
          </Select>
          <SearchableFilterSelect
            value={locationFilter || 'all'}
            onChange={(value) => setLocationFilter(value === 'all' ? '' : value)}
            options={locationOptions}
            placeholder="Location"
            allLabel="All Locations"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <Select value={experienceMinFilter || 'all'} onValueChange={(value) => setExperienceMinFilter(value === 'all' ? '' : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Min Experience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Min Experience</SelectItem>
              <SelectItem value="0">0+ years</SelectItem>
              <SelectItem value="1">1+ years</SelectItem>
              <SelectItem value="2">2+ years</SelectItem>
              <SelectItem value="3">3+ years</SelectItem>
              <SelectItem value="5">5+ years</SelectItem>
              <SelectItem value="8">8+ years</SelectItem>
            </SelectContent>
          </Select>
          <Select value={experienceMaxFilter || 'all'} onValueChange={(value) => setExperienceMaxFilter(value === 'all' ? '' : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Max Experience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Max Experience</SelectItem>
              <SelectItem value="1">Up to 1 year</SelectItem>
              <SelectItem value="2">Up to 2 years</SelectItem>
              <SelectItem value="3">Up to 3 years</SelectItem>
              <SelectItem value="5">Up to 5 years</SelectItem>
              <SelectItem value="8">Up to 8 years</SelectItem>
              <SelectItem value="12">Up to 12 years</SelectItem>
            </SelectContent>
          </Select>
          <SearchableFilterSelect
            value={employmentTypeFilter}
            onChange={setEmploymentTypeFilter}
            options={employmentTypeOptions}
            placeholder="Employment Type"
            allLabel="All Types"
          />
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'recent' | 'match')}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="match">Best Match</SelectItem>
              <SelectItem value="recent">Most Recent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Jobs List */}
      {scoredJobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium">No jobs found</h3>
            <p className="text-muted-foreground mt-1">
              {jobs.length === 0
                ? 'No jobs are available at the moment. Check back later!'
                : 'No jobs match your search criteria'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {scoredJobs.map((job) => {
            const hasApplied = appliedJobs.has(job._id);
            
            return (
              <Card key={job._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{job.title}</h3>
                        {hasApplied && (
                          <Badge variant="secondary">Applied</Badge>
                        )}
                        <Badge variant="outline" className="gap-1">
                          <Star className="w-3 h-3" />
                          Match {job.matchScore}%
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                        {job.description}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {job.employmentType}
                        </span>
                        {job.applicationDeadline && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                          </span>
                        )}
                        {typeof job.experienceMin === 'number' && (
                          <span>Experience: {job.experienceMin}{typeof job.experienceMax === 'number' ? `-${job.experienceMax}` : '+'} yrs</span>
                        )}
                        {typeof job.salaryMin === 'number' && (
                          <span>Salary: {job.salaryCurrency || 'USD'} {job.salaryMin}{typeof job.salaryMax === 'number' ? `-${job.salaryMax}` : '+'}</span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <Badge variant="secondary">Skill Match {job.skillMatchPercent}%</Badge>
                        <Badge variant="secondary">Experience {job.experienceFit}</Badge>
                        <Badge variant="secondary">Location {job.locationMatch}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => {
                          setSelectedJob(job);
                          setShowApplyDialog(true);
                        }}
                        disabled={hasApplied}
                      >
                        {hasApplied ? 'Applied' : 'Apply Now'}
                        {!hasApplied && <Send className="w-4 h-4 ml-2" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Apply Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={(open) => {
        setShowApplyDialog(open);
        if (!open) {
          setCoverLetter('');
          setKnockoutAnswers([]);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Apply for {selectedJob?.title}</DialogTitle>
            <DialogDescription>
              Submit your application for this position
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedJob && (
              <div className="p-4 bg-secondary/50 rounded-lg">
                <h4 className="font-medium">{selectedJob.title}</h4>
                <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {selectedJob.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {selectedJob.employmentType}
                  </span>
                </div>
              </div>
            )}
            
            {selectedJob && selectedJob.knockoutQuestions && selectedJob.knockoutQuestions.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <h4 className="text-sm font-medium">Required Questions</h4>
                {selectedJob.knockoutQuestions.map((kq, idx) => (
                  <div key={idx} className="space-y-1">
                    <label className="text-sm text-muted-foreground">{kq.question}</label>
                    <Select
                      value={knockoutAnswers.find(a => a.question === kq.question)?.answer || ''}
                      onValueChange={(val: string) => {
                        const newAnswers = [...knockoutAnswers.filter(a => a.question !== kq.question), { question: kq.question, answer: val }];
                        setKnockoutAnswers(newAnswers);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Yes or No" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}
            
            <div className="pt-4 border-t">
              <label className="text-sm font-medium">Cover Letter (Optional)</label>
              <Textarea
                placeholder="Write a brief cover letter explaining why you're a good fit for this role..."
                rows={5}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApplyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply} disabled={isApplying}>
              {isApplying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobListings;
