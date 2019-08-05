import chalk from "chalk";
import {Template, Templates} from "postmark/dist/client/models";
import {TableFormat} from "../../../handler/data/index";
import {find, pluralizeWithNumber} from "../../../handler/utils/Various";
import {TemplateManifest, TemplatePushReview} from "../../../types";

export class TemplateComparisonTable extends TableFormat{
  public getData(review: TemplatePushReview): string {
    this.colorizeTableElements(review.templates, {'Modified': chalk.green, 'Added': chalk.yellow, 'None': chalk.gray});
    this.colorizeTableElements(review.layouts, {'Modified': chalk.green, 'Added': chalk.yellow, 'None': chalk.gray});

    return this.getComparisonTables(review);
  }

  private getComparisonTables(review: TemplatePushReview): string {
    const {templates, layouts} = review;

    let result: string = '';
    result += this.getFormattedTable(templates, ['Change', 'Name', 'Alias', 'Layout used'], 'template');
    result += this.getFormattedTable(layouts, ['Change', 'Name', 'Alias'], 'layout');
    return result;
  }

  public getTemplatesComparisonTable(templatesOnServer: Templates,
                                     templatesToPush: TemplateManifest[]): TemplatePushReview {
    let review: TemplatePushReview = {layouts: [], templates: []};

    templatesToPush.forEach(template => {
      const reviewData: string[] = this.generateBaseReviewData(template, templatesOnServer);
      if (template.TemplateType === 'Standard') {
        reviewData.push(template.LayoutTemplate ? template.LayoutTemplate : 'None');
        review.templates.push(reviewData)
      }
      else {
        review.layouts.push(reviewData)
      }
    });

    return review;
  }

  public generateBaseReviewData(template:any, templatesOnServer: Templates): string[] {
    const templateOnServerFound: Template|undefined = this.findLocalTemplateOnServer(templatesOnServer, template);

    return [
      !templateOnServerFound ? 'Added' : 'Modified',
      template.Name || '',
      template.Alias || '',
    ];
  }

  private getFormattedTable(elements: any, header: string[], type: string): string {
    return (elements.length > 0) ? this.getTable(header,elements, pluralizeWithNumber(elements.length, type)) : '';
  }

  private findLocalTemplateOnServer(templatesOnServer: any, templateToPush: TemplateManifest): Template|undefined {
    return find<Template>(templatesOnServer.Templates, {Alias: templateToPush.Alias});
  }

  private layoutUsedLabel(localLayout: string | null | undefined, serverLayout: string | null | undefined): string {
    let label: string = localLayout ? localLayout : chalk.gray('None');

    // If layout template on server doesn't templateOnServerFound local template
    if (localLayout !== serverLayout) {
      serverLayout = serverLayout ? serverLayout : 'None';

      // Append old server layout to label
      label += chalk.red(`  ✘ ${serverLayout}`)
    }

    return label
  }
}