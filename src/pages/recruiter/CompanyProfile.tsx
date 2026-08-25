import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  CalendarDays,
  Globe,
  Linkedin,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
} from 'lucide-react';
import { profileApi, Profile } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+' | '';

interface CompanyProfileForm {
  fullName: string;
  phone: string;
  location: string;
  companyName: string;
  companyWebsite: string;
  companyLinkedinUrl: string;
  companyLogoUrl: string;
  companyIndustry: string;
  companySize: CompanySize;
  companyFoundedYear: string;
  companyHeadquarters: string;
  companyDescription: string;
}

const COMPANY_SIZE_OPTIONS: Array<{ value: Exclude<CompanySize, ''>; label: string }> = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1000+', label: '1000+ employees' },
];

const isValidHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const buildFormState = (profile: Profile | null): CompanyProfileForm => ({
  fullName: profile?.fullName || '',
  phone: profile?.phone || '',
  location: profile?.location || '',
  companyName: profile?.companyName || '',
  companyWebsite: profile?.companyWebsite || '',
  companyLinkedinUrl: profile?.companyLinkedinUrl || '',
  companyLogoUrl: profile?.companyLogoUrl || '',
  companyIndustry: profile?.companyIndustry || '',
  companySize: profile?.companySize || '',
  companyFoundedYear: profile?.companyFoundedYear ? String(profile.companyFoundedYear) : '',
  companyHeadquarters: profile?.companyHeadquarters || '',
  companyDescription: profile?.companyDescription || '',
});

const CompanyProfile = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState<CompanyProfileForm>(buildFormState(null));

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await profileApi.getProfile();
        const currentProfile = response.data?.user;

        if (!currentProfile) {
          throw new Error('Profile payload is missing');
        }

        setProfile(currentProfile);
        setFormData(buildFormState(currentProfile));
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error?.message || 'Failed to load company profile',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [toast]);

  const completionPercent = useMemo(() => {
    const checks = [
      formData.companyName,
      formData.companyIndustry,
      formData.companySize,
      formData.companyWebsite,
      formData.companyHeadquarters,
      formData.companyDescription,
      formData.companyLinkedinUrl,
      formData.companyLogoUrl,
    ];

    const completed = checks.filter((value) => String(value || '').trim().length > 0).length;
    return Math.round((completed / checks.length) * 100);
  }, [formData]);

  const handleChange = (name: keyof CompanyProfileForm, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const trimmed = {
      fullName: formData.fullName.trim(),
      phone: formData.phone.trim(),
      location: formData.location.trim(),
      companyName: formData.companyName.trim(),
      companyWebsite: formData.companyWebsite.trim(),
      companyLinkedinUrl: formData.companyLinkedinUrl.trim(),
      companyLogoUrl: formData.companyLogoUrl.trim(),
      companyIndustry: formData.companyIndustry.trim(),
      companySize: formData.companySize,
      companyHeadquarters: formData.companyHeadquarters.trim(),
      companyDescription: formData.companyDescription.trim(),
    };

    if (!trimmed.fullName) {
      toast({
        title: 'Validation Error',
        description: 'Recruiter name is required.',
        variant: 'destructive',
      });
      return;
    }

    const hasCompanyDetails = [
      trimmed.companyIndustry,
      trimmed.companySize,
      trimmed.companyWebsite,
      trimmed.companyLinkedinUrl,
      trimmed.companyLogoUrl,
      trimmed.companyHeadquarters,
      trimmed.companyDescription,
      formData.companyFoundedYear.trim(),
    ].some((value) => String(value || '').trim().length > 0);

    if (!trimmed.companyName && hasCompanyDetails) {
      toast({
        title: 'Validation Error',
        description: 'Company name is required when adding company details.',
        variant: 'destructive',
      });
      return;
    }

    const urlFields = [
      { label: 'Company website', value: trimmed.companyWebsite },
      { label: 'Company LinkedIn URL', value: trimmed.companyLinkedinUrl },
      { label: 'Company logo URL', value: trimmed.companyLogoUrl },
    ];

    for (const field of urlFields) {
      if (field.value && !isValidHttpUrl(field.value)) {
        toast({
          title: 'Validation Error',
          description: `${field.label} must be a valid http:// or https:// URL.`,
          variant: 'destructive',
        });
        return;
      }
    }

    let foundedYearValue: number | null = null;
    if (formData.companyFoundedYear.trim()) {
      foundedYearValue = Number(formData.companyFoundedYear);
      const currentYear = new Date().getFullYear();
      if (!Number.isInteger(foundedYearValue) || foundedYearValue < 1800 || foundedYearValue > currentYear + 1) {
        toast({
          title: 'Validation Error',
          description: `Founded year must be between 1800 and ${currentYear + 1}.`,
          variant: 'destructive',
        });
        return;
      }
    }

    setSaving(true);

    try {
      const payload: Partial<Profile> & { companyFoundedYear: number | null } = {
        fullName: trimmed.fullName,
        phone: trimmed.phone,
        location: trimmed.location,
        companyName: trimmed.companyName,
        companyWebsite: trimmed.companyWebsite,
        companyLinkedinUrl: trimmed.companyLinkedinUrl,
        companyLogoUrl: trimmed.companyLogoUrl,
        companyIndustry: trimmed.companyIndustry,
        companySize: trimmed.companySize || undefined,
        companyFoundedYear: foundedYearValue,
        companyHeadquarters: trimmed.companyHeadquarters,
        companyDescription: trimmed.companyDescription,
      };

      const response = await profileApi.updateProfile(payload);
      const updatedProfile = response.data?.user;

      if (!updatedProfile) {
        throw new Error('Updated profile payload is missing');
      }

      setProfile(updatedProfile);
      setFormData(buildFormState(updatedProfile));

      if (updatedProfile.fullName && updatedProfile.fullName !== user?.fullName) {
        updateUser({ fullName: updatedProfile.fullName });
      }

      toast({
        title: 'Saved',
        description: 'Company settings updated successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to save company profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-72">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Company Settings</h1>
        <p className="text-muted-foreground">Manage your recruiter and company profile details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Identity
              </CardTitle>
              <CardDescription>Core information that candidates see.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Recruiter Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    placeholder="Your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Recruiter Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" value={profile?.email || ''} disabled className="pl-10 bg-muted" />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    placeholder="Acme Technologies"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyIndustry">Industry</Label>
                  <Input
                    id="companyIndustry"
                    value={formData.companyIndustry}
                    onChange={(e) => handleChange('companyIndustry', e.target.value)}
                    placeholder="Software"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Company Size</Label>
                  <Select
                    value={formData.companySize || 'none'}
                    onValueChange={(value) => handleChange('companySize', value === 'none' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not set</SelectItem>
                      {COMPANY_SIZE_OPTIONS.map((size) => (
                        <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="foundedYear">Founded Year</Label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="foundedYear"
                      type="number"
                      min={1800}
                      max={new Date().getFullYear() + 1}
                      value={formData.companyFoundedYear}
                      onChange={(e) => handleChange('companyFoundedYear', e.target.value)}
                      placeholder="2016"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyHeadquarters">Headquarters</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="companyHeadquarters"
                      value={formData.companyHeadquarters}
                      onChange={(e) => handleChange('companyHeadquarters', e.target.value)}
                      placeholder="Bangalore, India"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Online Presence & Contact</CardTitle>
              <CardDescription>Public links and recruiter contact details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="companyWebsite">Company Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="companyWebsite"
                      value={formData.companyWebsite}
                      onChange={(e) => handleChange('companyWebsite', e.target.value)}
                      placeholder="https://company.com"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="companyLinkedin">Company LinkedIn</Label>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="companyLinkedin"
                      value={formData.companyLinkedinUrl}
                      onChange={(e) => handleChange('companyLinkedinUrl', e.target.value)}
                      placeholder="https://linkedin.com/company/your-company"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="companyLogo">Company Logo URL</Label>
                  <Input
                    id="companyLogo"
                    value={formData.companyLogoUrl}
                    onChange={(e) => handleChange('companyLogoUrl', e.target.value)}
                    placeholder="https://cdn.company.com/logo.png"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Recruiter Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="+1 555 123 4567"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Recruiter Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="Remote"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Completion</CardTitle>
              <CardDescription>Improve trust with candidates by completing your profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">{completionPercent}% complete</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About Company</CardTitle>
              <CardDescription>Add a short company summary for applicants.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyDescription">Company Description</Label>
                <Textarea
                  id="companyDescription"
                  value={formData.companyDescription}
                  onChange={(e) => handleChange('companyDescription', e.target.value)}
                  placeholder="Tell candidates what your company does and what kind of talent you are looking for."
                  rows={7}
                />
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Company Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile;
