/**
 * Script represents a single script.
 */
export interface Script {
  /** The content type */
  url: string;
  /** The content type */
  redirectedUrl: string;
  /** The content type */
  contentType: string;
  /** The source code of the script */
  source: string;
  /** The dependency Urls */
  dependencyUrls: string[];
}
