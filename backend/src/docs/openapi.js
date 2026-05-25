const spec = {
  openapi: '3.0.0',
  info: {
    title: 'RoleLink API',
    version: '1.0.0',
    description: 'RoleLink Job Listing Portal backend APIs.'
  },
  servers: [{ url: 'http://localhost:5000' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },




    
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['jobseeker', 'employer'] },
          skills: { type: 'array', items: { type: 'string' } },
          education: { type: 'string' },
          experience: { type: 'string' },
          resumeUrl: { type: 'string' },
          phone: { type: 'string' },
          location: { type: 'string' },
          linkedin: { type: 'string' },
          github: { type: 'string' },
          portfolio: { type: 'string' },
          certifications: { type: 'string' },
          achievements: { type: 'string' },
          competitions: { type: 'string' },
          skillsCategories: {
            type: 'object',
            properties: {
              programmingLanguages: { type: 'string' },
              webTechnologies: { type: 'string' },
              databases: { type: 'string' },
              tools: { type: 'string' },
              interests: { type: 'string' }
            }
          },
          createdAt: { type: 'string' }
        }
      },
      Job: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          companyName: { type: 'string' },
          companyLogoUrl: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          qualifications: { type: 'string' },
          responsibilities: { type: 'string' },
          location: { type: 'string' },
          salaryRange: { type: 'string' },
          jobType: { type: 'string' },
          employerId: { type: 'string' },
          createdAt: { type: 'string' }
        }
      },
      Application: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          jobId: { type: 'string' },
          applicantId: { type: 'string' },
          resumeUrl: { type: 'string' },
          status: { type: 'string', enum: ['Applied', 'Shortlisted', 'Rejected'] },
          createdAt: { type: 'string' }
        }
      },
      AuthResponse: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          user: { $ref: '#/components/schemas/User' }
        }
      },
      ResumeAnalysis: {
        type: 'object',
        properties: {
          score: { type: 'number' },
          missingKeywords: { type: 'array', items: { type: 'string' } },
          suggestions: { type: 'array', items: { type: 'string' } },
          skillsDetected: { type: 'array', items: { type: 'string' } },
          recommendedJobs: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                title: { type: 'string' },
                location: { type: 'string' },
                jobType: { type: 'string' },
                salaryRange: { type: 'string' },
                employer: { type: 'string' },
                companyName: { type: 'string' },
                companyLogoUrl: { type: 'string' },
                matchScore: { type: 'number' },
                matchedSkills: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      },
      ResumeGenerate: {
        type: 'object',
        properties: {
          resumeText: { type: 'string' }
        }
      }
    }
  },
  tags: [
    { name: 'Auth' },
    { name: 'Jobs' },
    { name: 'Applications' },
    { name: 'Resume' },
    { name: 'Notifications' }
  ],
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password', 'role'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email', description: 'Rejects common misspelled provider domains such as gmil.com.' },
                  password: { type: 'string' },
                  role: { type: 'string', enum: ['jobseeker', 'employer'] },
                  skills: { type: 'array', items: { type: 'string' } },
                  education: { type: 'string' },
                  experience: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Registered',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } }
          }
        }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', description: 'Rejects common misspelled provider domains such as gmil.com.' },
                  password: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Logged in',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } }
          }
        }
      }
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Current user',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          }
        }
      },
      put: {
        tags: ['Auth'],
        summary: 'Update current user profile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email', description: 'Rejects common misspelled provider domains such as gmil.com.' },
                  phone: { type: 'string' },
                  location: { type: 'string' },
                  skills: { oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
                  education: { type: 'string' },
                  experience: { type: 'string' },
                  github: { type: 'string' },
                  linkedin: { type: 'string' },
                  portfolio: { type: 'string' },
                  certifications: { type: 'string' },
                  achievements: { type: 'string' },
                  competitions: { type: 'string' },
                  skillsCategories: {
                    type: 'object',
                    properties: {
                      programmingLanguages: { type: 'string' },
                      webTechnologies: { type: 'string' },
                      databases: { type: 'string' },
                      tools: { type: 'string' },
                      interests: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Updated user',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/auth/resume': {
      post: {
        tags: ['Auth'],
        summary: 'Upload resume to profile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['resume'],
                properties: {
                  resume: { type: 'string', format: 'binary' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Resume uploaded',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                    resumeUrl: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/jobs': {
      get: {
        tags: ['Jobs'],
        summary: 'Get all jobs',
        responses: {
          200: {
            description: 'Job list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    jobs: { type: 'array', items: { $ref: '#/components/schemas/Job' } }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Jobs'],
        summary: 'Create a job',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'description'],
                properties: {
                  companyName: { type: 'string' },
                  companyLogoUrl: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  qualifications: { type: 'string' },
                  responsibilities: { type: 'string' },
                  location: { type: 'string' },
                  salaryRange: { type: 'string' },
                  jobType: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Job created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    job: { $ref: '#/components/schemas/Job' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/jobs/{id}': {
      get: {
        tags: ['Jobs'],
        summary: 'Get job by id',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Job',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    job: { $ref: '#/components/schemas/Job' }
                  }
                }
              }
            }
          }
        }
      },
      put: {
        tags: ['Jobs'],
        summary: 'Update job',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  companyName: { type: 'string' },
                  companyLogoUrl: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  qualifications: { type: 'string' },
                  responsibilities: { type: 'string' },
                  location: { type: 'string' },
                  salaryRange: { type: 'string' },
                  jobType: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Job updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    job: { $ref: '#/components/schemas/Job' }
                  }
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Jobs'],
        summary: 'Delete job',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Job deleted',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { message: { type: 'string' } } }
              }
            }
          }
        }
      }
    },
    '/api/applications': {
      post: {
        tags: ['Applications'],
        summary: 'Apply to a job',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['jobId'],
                properties: {
                  jobId: { type: 'string' },
                  resume: { type: 'string', format: 'binary' },
                  resumeUrl: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Application created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    application: { $ref: '#/components/schemas/Application' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/applications/my': {
      get: {
        tags: ['Applications'],
        summary: 'Get my applications',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Applications',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    applications: { type: 'array', items: { $ref: '#/components/schemas/Application' } }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/applications/job/{jobId}': {
      get: {
        tags: ['Applications'],
        summary: 'Get applications for a job',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'jobId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Applications',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    applications: { type: 'array', items: { $ref: '#/components/schemas/Application' } }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/applications/{id}/status': {
      patch: {
        tags: ['Applications'],
        summary: 'Update application status',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['Applied', 'Shortlisted', 'Rejected'] }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Application updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    application: { $ref: '#/components/schemas/Application' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/resume/analyze': {
      post: {
        tags: ['Resume'],
        summary: 'Analyze resume',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['resume'],
                properties: {
                  resume: { type: 'string', format: 'binary' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Analysis',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ResumeAnalysis' } } }
          }
        }
      }
    },
    '/api/resume/generate': {
      post: {
        tags: ['Resume'],
        summary: 'Generate ATS resume',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  phone: { type: 'string' },
                  location: { type: 'string' },
                  github: { type: 'string' },
                  linkedin: { type: 'string' },
                  portfolio: { type: 'string' },
                  skills: { oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
                  education: { type: 'string' },
                  experience: { type: 'string' },
                  certifications: { type: 'string' },
                  achievements: { type: 'string' },
                  competitions: { type: 'string' },
                  projects: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        link: { type: 'string' },
                        description: { type: 'string' }
                      }
                    }
                  },
                  skillsCategories: {
                    type: 'object',
                    properties: {
                      programmingLanguages: { type: 'string' },
                      webTechnologies: { type: 'string' },
                      databases: { type: 'string' },
                      tools: { type: 'string' },
                      interests: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Generated resume',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ResumeGenerate' } } }
          }
        }
      }
    },
    '/api/resume/generate-pdf': {
      post: {
        tags: ['Resume'],
        summary: 'Generate resume PDF',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'resumeText'],
                properties: {
                  name: { type: 'string' },
                  resumeText: { type: 'string' },
                  links: {
                    type: 'object',
                    properties: {
                      github: { type: 'string' },
                      linkedin: { type: 'string' },
                      portfolio: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'PDF file',
            content: { 'application/pdf': {} }
          }
        }
      }
    },
    '/api/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'Get user notifications',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Notifications list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    notifications: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          type: { type: 'string' },
                          message: { type: 'string' },
                          createdAt: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

module.exports = spec;
