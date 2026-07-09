export interface InstituteTerms {
  termInstitution: string;   // College / School / University
  termCardMenu: string;      // College Card / School Card / Student Card
  termPrincipal: string;     // Principal / Headmaster / Vice Chancellor
  blogHeading: string;
  blogDescription: string;
  notesHeading: string;
  notesDescription: string;
  eventsHeading: string;
  eventsDescription: string;
  notificationsHeading: string;
  notificationsDescription: string;
  contactHeading: string;
  contactDescription: string;
  projectsPageHeading: string;
  projectsPageSubheading: string;
  projectsDeptHeading: string;
  academicSectionHeading: string;
  academicSectionSubheading: string;
}

export function getInstituteTerms(
  type: string,
  name: string,
  shortName: string,
  customType?: string
): InstituteTerms {

  const inst = type === 'college'    ? 'College'
             : type === 'school'     ? 'School'
             : type === 'university' ? 'University'
             : customType || 'Institute';

  const card = type === 'college'    ? 'College Card'
             : type === 'school'     ? 'Library Card'
             : type === 'university' ? 'Student Card'
             : 'ID Card';

  const principal = type === 'college'    ? 'Principal'
                  : type === 'school'     ? 'Principal'
                  : type === 'university' ? 'Vice Chancellor'
                  : 'Director';

  return {
    termInstitution: inst,
    termCardMenu: card,
    termPrincipal: principal,

    blogHeading: `${shortName} News & Updates`,
    blogDescription: `Stay informed with the latest academic updates from ${name}`,

    notesHeading: 'Study Notes',
    notesDescription: `Download notes and resources shared by ${name} faculty`,

    eventsHeading: `${inst} Events`,
    eventsDescription: `Stay updated with upcoming events and activities at ${name}`,

    notificationsHeading: 'Notifications',
    notificationsDescription: `Official announcements, news, and updates from ${name}`,

    contactHeading: 'Contact Us',
    contactDescription: `Get in touch with ${name} for official information and student support`,

    projectsPageHeading: `${name} Projects`,
    projectsPageSubheading: `Student & Faculty Research Projects`,

    projectsDeptHeading: `${inst} Research Department`,
    academicSectionHeading: 'Academic Programs',
    academicSectionSubheading: `Excellence in Education at ${name}`,
  };
}
